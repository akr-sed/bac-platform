import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Session from '@/models/Session';
import SessionEnrollment from '@/models/SessionEnrollment';
import { sessionToDTO } from '@/lib/session-dto';

// See note in POST schema: enforce http(s) allowlist on meetingUrl to block
// `javascript:` / `data:` URI XSS at the API boundary.
const httpUrlSchema = z
  .string()
  .url('meetingUrl must be a valid URL')
  .refine(
    (u) => /^https?:\/\//i.test(u),
    'meetingUrl must use http or https'
  );

const updateSessionSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    subject: z.string().min(1).optional(),
    topics: z.array(z.string()).optional(),
    exerciseIds: z.array(z.string()).optional(),
    scheduledAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid scheduledAt')
      .optional(),
    durationMinutes: z.number().int().min(15).max(480).optional(),
    meetingUrl: httpUrlSchema.optional(),
    capacity: z.number().int().min(1).nullable().optional(),
    priceDA: z.number().min(0).optional(),
    status: z
      .enum(['scheduled', 'live', 'completed', 'cancelled'])
      .optional(),
  })
  .strict();

const TEACHER_POPULATE = {
  path: 'teacherId',
  select: 'name avatar role isVerifiedTeacher',
};

type RouteContext = { params: Promise<{ id: string }> };

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionDoc = await Session.findById(id)
      .populate(TEACHER_POPULATE)
      .lean();
    if (!sessionDoc) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const auth = await getSession();
    let isEnrolled = false;
    let isOwner = false;
    if (auth) {
      isOwner =
        auth.userId ===
        String(
          (sessionDoc.teacherId as { _id?: unknown })?._id ??
            sessionDoc.teacherId
        );
      if (!isOwner) {
        const enrollment = await SessionEnrollment.findOne({
          userId: new Types.ObjectId(auth.userId),
          sessionId: sessionDoc._id,
        }).lean();
        isEnrolled = Boolean(enrollment);
      }
    }
    const includeMeetingUrl = isOwner || isEnrolled;
    return NextResponse.json(
      sessionToDTO(
        sessionDoc as unknown as Parameters<typeof sessionToDTO>[0],
        {
          isEnrolled: auth ? isEnrolled : undefined,
          isOwner: auth ? isOwner : undefined,
          includeMeetingUrl,
        }
      )
    );
  } catch (err) {
    console.error('[sessions:GET/:id]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionDoc = await Session.findById(id);
    if (!sessionDoc) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (
      sessionDoc.teacherId.toString() !== auth.userId &&
      auth.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const result = updateSessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Cancellation is final: once a session is `cancelled`, it cannot be
    // resurrected via PATCH. The DELETE route soft-deletes by flipping
    // status, so allowing the same teacher to PATCH back to `scheduled`
    // would reopen the session and bypass the cancellation cascade.
    if (
      sessionDoc.status === 'cancelled' &&
      result.data.status &&
      result.data.status !== 'cancelled'
    ) {
      return NextResponse.json(
        { error: 'Cancelled sessions cannot be reopened' },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = { ...result.data };
    if (typeof update.scheduledAt === 'string') {
      update.scheduledAt = new Date(update.scheduledAt);
    }
    if (Array.isArray(update.exerciseIds)) {
      try {
        update.exerciseIds = (update.exerciseIds as string[]).map(
          (eid) => new Types.ObjectId(eid)
        );
      } catch {
        return NextResponse.json(
          { error: 'Invalid exerciseId in exerciseIds' },
          { status: 400 }
        );
      }
    }

    const updated = await Session.findByIdAndUpdate(id, update, { new: true })
      .populate(TEACHER_POPULATE)
      .lean();
    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(
      sessionToDTO(updated as unknown as Parameters<typeof sessionToDTO>[0], {
        isOwner: true,
        includeMeetingUrl: true,
      })
    );
  } catch (err) {
    console.error('[sessions:PATCH]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  // Soft-delete: mark cancelled instead of removing.
  try {
    await connectToDatabase();
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionDoc = await Session.findById(id);
    if (!sessionDoc) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (
      sessionDoc.teacherId.toString() !== auth.userId &&
      auth.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    sessionDoc.status = 'cancelled';
    await sessionDoc.save();
    return NextResponse.json({ success: true, status: 'cancelled' });
  } catch (err) {
    console.error('[sessions:DELETE]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
