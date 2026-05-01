import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Session from '@/models/Session';
import SessionEnrollment from '@/models/SessionEnrollment';
import { sessionToDTO } from '@/lib/session-dto';

// Restrict meetingUrl to http(s). Zod's `.url()` would otherwise accept
// `javascript:` and `data:` schemes, opening an XSS vector when the URL is
// rendered into an `<a href>` on the detail page.
const httpUrlSchema = z
  .string()
  .url('meetingUrl must be a valid URL')
  .refine(
    (u) => /^https?:\/\//i.test(u),
    'meetingUrl must use http or https'
  );

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  subject: z.string().min(1),
  topics: z.array(z.string()).optional().default([]),
  exerciseIds: z.array(z.string()).optional().default([]),
  scheduledAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid scheduledAt'),
  durationMinutes: z.number().int().min(15).max(480),
  meetingUrl: httpUrlSchema,
  capacity: z.number().int().min(1).nullable().optional().default(null),
  priceDA: z.number().min(0).optional().default(0),
});

const TEACHER_POPULATE = {
  path: 'teacherId',
  select: 'name avatar role isVerifiedTeacher',
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '10'))
    );
    const subject = searchParams.get('subject');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const teacherId = searchParams.get('teacherId');

    const filter: Record<string, unknown> = {};
    if (subject) filter.subject = subject;
    if (
      status &&
      ['scheduled', 'live', 'completed', 'cancelled'].includes(status)
    ) {
      filter.status = status;
    }
    if (upcoming) {
      filter.scheduledAt = { $gte: new Date() };
      if (!filter.status) filter.status = { $in: ['scheduled', 'live'] };
    }
    if (teacherId) {
      try {
        filter.teacherId = new Types.ObjectId(teacherId);
      } catch {
        return NextResponse.json(
          { error: 'Invalid teacherId' },
          { status: 400 }
        );
      }
    }

    const [items, total] = await Promise.all([
      Session.find(filter)
        .populate(TEACHER_POPULATE)
        .sort(upcoming ? { scheduledAt: 1 } : { scheduledAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Session.countDocuments(filter),
    ]);

    let enrolledIds = new Set<string>();
    if (session) {
      const sessionIds = items.map((i) => i._id);
      const enrollments = await SessionEnrollment.find({
        userId: new Types.ObjectId(session.userId),
        sessionId: { $in: sessionIds },
      }).select('sessionId');
      enrolledIds = new Set(enrollments.map((e) => String(e.sessionId)));
    }

    const data = items.map((s) => {
      const id = String(s._id);
      const isOwner =
        session?.userId === String((s.teacherId as { _id?: unknown })?._id ?? s.teacherId);
      const isEnrolled = enrolledIds.has(id);
      const includeMeetingUrl = isOwner || isEnrolled;
      return sessionToDTO(
        s as unknown as Parameters<typeof sessionToDTO>[0],
        {
          isEnrolled: session ? isEnrolled : undefined,
          isOwner: session ? isOwner : undefined,
          includeMeetingUrl,
        }
      );
    });

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'teacher' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers can create sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createSessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const exerciseObjectIds: Types.ObjectId[] = [];
    for (const id of result.data.exerciseIds) {
      try {
        exerciseObjectIds.push(new Types.ObjectId(id));
      } catch {
        return NextResponse.json(
          { error: 'Invalid exerciseId in exerciseIds' },
          { status: 400 }
        );
      }
    }

    const created = await Session.create({
      title: result.data.title,
      description: result.data.description,
      teacherId: new Types.ObjectId(session.userId),
      subject: result.data.subject,
      topics: result.data.topics,
      exerciseIds: exerciseObjectIds,
      scheduledAt: new Date(result.data.scheduledAt),
      durationMinutes: result.data.durationMinutes,
      meetingUrl: result.data.meetingUrl,
      capacity: result.data.capacity,
      priceDA: result.data.priceDA,
    });

    const populated = await Session.findById(created._id)
      .populate(TEACHER_POPULATE)
      .lean();
    if (!populated) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      sessionToDTO(populated as unknown as Parameters<typeof sessionToDTO>[0], {
        isEnrolled: false,
        isOwner: true,
        includeMeetingUrl: true,
      }),
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
