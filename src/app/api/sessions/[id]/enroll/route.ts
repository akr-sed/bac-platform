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
    const sessionDoc = await Session.findById(id);
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
    if (
      sessionDoc.capacity != null &&
      sessionDoc.enrolledCount >= sessionDoc.capacity
    ) {
      return NextResponse.json({ error: 'Session is full' }, { status: 409 });
    }

    try {
      await SessionEnrollment.create({
        userId: new Types.ObjectId(auth.userId),
        sessionId: sessionDoc._id,
      });
    } catch (err) {
      const e = err as MongoDuplicateKeyError;
      if (e?.code === 11000) {
        return NextResponse.json(
          { error: 'Already enrolled' },
          { status: 409 }
        );
      }
      throw err;
    }

    const refreshed = await Session.findById(id).select('enrolledCount');
    return NextResponse.json(
      {
        success: true,
        enrolledCount: refreshed?.enrolledCount ?? sessionDoc.enrolledCount + 1,
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
