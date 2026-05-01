import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Session from '@/models/Session';
import SessionEnrollment from '@/models/SessionEnrollment';

type RouteContext = { params: Promise<{ id: string }> };

interface MongoDuplicateKeyError extends Error {
  code?: number;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Pre-check the session for friendly error messages (not-found, cancelled,
    // teacher-self-enroll). The capacity gate is enforced atomically below to
    // close the TOCTOU window between read+write that previously allowed two
    // concurrent enrollers to both pass `enrolledCount < capacity`.
    const sessionDoc = await Session.findById(id).select(
      '_id status teacherId capacity enrolledCount'
    );
    if (!sessionDoc) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (sessionDoc.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Session is not open for enrollment' },
        { status: 400 }
      );
    }
    if (sessionDoc.teacherId.toString() === auth.userId) {
      return NextResponse.json(
        { error: 'Teachers cannot enroll in their own session' },
        { status: 400 }
      );
    }

    // Atomic capacity claim: the filter only matches when the session is still
    // `scheduled` AND (capacity is null OR enrolledCount < capacity). MongoDB
    // serializes `findOneAndUpdate` against a single document, so two
    // concurrent claims at capacity=1 cannot both succeed — one returns null.
    const claim = await Session.findOneAndUpdate(
      {
        _id: sessionDoc._id,
        status: 'scheduled',
        $or: [
          { capacity: null },
          { $expr: { $lt: ['$enrolledCount', '$capacity'] } },
        ],
      },
      { $inc: { enrolledCount: 1 } },
      { new: true }
    );

    if (!claim) {
      // Re-read to pick the right error: full vs. status changed (cancelled,
      // live, completed) under us.
      const fresh = await Session.findById(id).select('status');
      if (!fresh) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      if (fresh.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Session is not open for enrollment' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Session is full' }, { status: 409 });
    }

    // The atomic claim already incremented enrolledCount; create the
    // enrollment record now. If create fails (duplicate enrollment, or any
    // other error), compensate by decrementing the counter so it stays
    // consistent.
    try {
      await SessionEnrollment.create({
        userId: new Types.ObjectId(auth.userId),
        sessionId: sessionDoc._id,
      });
    } catch (err) {
      await Session.updateOne(
        { _id: sessionDoc._id },
        { $inc: { enrolledCount: -1 } }
      );
      const e = err as MongoDuplicateKeyError;
      if (e?.code === 11000) {
        return NextResponse.json(
          { error: 'Already enrolled' },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json(
      {
        success: true,
        enrolledCount: claim.enrolledCount,
        isEnrolled: true,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const removed = await SessionEnrollment.findOneAndDelete({
      userId: new Types.ObjectId(auth.userId),
      sessionId: new Types.ObjectId(id),
    });
    if (!removed) {
      return NextResponse.json(
        { error: 'You are not enrolled' },
        { status: 404 }
      );
    }
    const refreshed = await Session.findById(id).select('enrolledCount');
    return NextResponse.json({
      success: true,
      enrolledCount: refreshed?.enrolledCount ?? 0,
      isEnrolled: false,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
