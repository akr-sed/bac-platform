import { Types } from 'mongoose';
import { connectToDatabase } from './mongodb';
import Session from '@/models/Session';
import SessionEnrollment from '@/models/SessionEnrollment';
import { sessionToDTO } from './session-dto';
import type { SessionDTO } from '@/types';

/**
 * Server-side data layer for sessions.
 *
 * Server Components and route handlers should import these helpers instead
 * of doing an HTTP loopback fetch (`fetch(\`${protocol}://${host}/api/...\`)`)
 * to their own API routes — that pattern doubles latency, re-runs cookie
 * parsing twice, and breaks when `x-forwarded-proto` is missing on certain
 * hosts. The API routes themselves are still the source of truth for
 * mutations and cross-origin clients.
 */

const TEACHER_POPULATE = {
  path: 'teacherId',
  select: 'name avatar role isVerifiedTeacher',
};

interface FetchSessionsListOpts {
  upcoming?: boolean;
  subject?: string | null;
  status?: string | null;
  teacherId?: string | null;
  limit?: number;
  page?: number;
  /** Authenticated viewer (used to compute isOwner / isEnrolled / meetingUrl visibility). */
  viewerUserId?: string | null;
}

export async function fetchSessionsList(
  opts: FetchSessionsListOpts = {}
): Promise<{ data: SessionDTO[]; total: number; page: number; totalPages: number }> {
  await connectToDatabase();
  const {
    upcoming = false,
    subject = null,
    status = null,
    teacherId = null,
    viewerUserId = null,
  } = opts;
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const page = Math.max(1, opts.page ?? 1);

  const filter: Record<string, unknown> = {};
  if (subject) filter.subject = subject;
  if (status && ['scheduled', 'live', 'completed', 'cancelled'].includes(status)) {
    filter.status = status;
  }
  if (upcoming) {
    filter.scheduledAt = { $gte: new Date() };
    if (filter.status === 'cancelled' || filter.status === 'completed') {
      // Caller asked for an empty intersection; return nothing rather than
      // surface an error from a server component.
      return { data: [], total: 0, page, totalPages: 1 };
    }
    if (!filter.status) filter.status = { $in: ['scheduled', 'live'] };
  }
  if (teacherId) {
    if (!Types.ObjectId.isValid(teacherId)) {
      return { data: [], total: 0, page, totalPages: 1 };
    }
    filter.teacherId = new Types.ObjectId(teacherId);
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
  if (viewerUserId && items.length > 0) {
    const sessionIds = items.map((i) => i._id);
    const enrollments = await SessionEnrollment.find({
      userId: new Types.ObjectId(viewerUserId),
      sessionId: { $in: sessionIds },
    })
      .select('sessionId')
      .lean();
    enrolledIds = new Set(enrollments.map((e) => String(e.sessionId)));
  }

  const data = items.map((s) => {
    const id = String(s._id);
    const isOwner =
      viewerUserId === String((s.teacherId as { _id?: unknown })?._id ?? s.teacherId);
    const isEnrolled = enrolledIds.has(id);
    const includeMeetingUrl = isOwner || isEnrolled;
    return sessionToDTO(
      s as unknown as Parameters<typeof sessionToDTO>[0],
      {
        isEnrolled: viewerUserId ? isEnrolled : undefined,
        isOwner: viewerUserId ? isOwner : undefined,
        includeMeetingUrl,
      }
    );
  });

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function fetchSessionById(
  id: string,
  viewerUserId: string | null = null
): Promise<SessionDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const sessionDoc = await Session.findById(id)
    .populate(TEACHER_POPULATE)
    .lean();
  if (!sessionDoc) return null;

  let isEnrolled = false;
  let isOwner = false;
  if (viewerUserId) {
    isOwner =
      viewerUserId ===
      String(
        (sessionDoc.teacherId as { _id?: unknown })?._id ?? sessionDoc.teacherId
      );
    if (!isOwner) {
      const enrollment = await SessionEnrollment.findOne({
        userId: new Types.ObjectId(viewerUserId),
        sessionId: sessionDoc._id,
      }).lean();
      isEnrolled = Boolean(enrollment);
    }
  }
  const includeMeetingUrl = isOwner || isEnrolled;
  return sessionToDTO(
    sessionDoc as unknown as Parameters<typeof sessionToDTO>[0],
    {
      isEnrolled: viewerUserId ? isEnrolled : undefined,
      isOwner: viewerUserId ? isOwner : undefined,
      includeMeetingUrl,
    }
  );
}
