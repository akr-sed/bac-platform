import type { SessionDTO, SessionTeacherDTO, SessionStatus } from '@/types';

interface RawTeacher {
  _id: { toString(): string } | string;
  name: string;
  avatar?: string | null;
  role: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
}

interface RawSession {
  _id: { toString(): string } | string;
  title: string;
  description: string;
  teacherId: RawTeacher | { toString(): string } | string;
  subject: string;
  topics: string[];
  exerciseIds: Array<{ toString(): string } | string>;
  scheduledAt: Date | string;
  durationMinutes: number;
  meetingUrl: string;
  capacity: number | null;
  priceDA: number;
  status: SessionStatus;
  enrolledCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function asString(v: { toString(): string } | string): string {
  return typeof v === 'string' ? v : v.toString();
}

function asTeacher(t: RawSession['teacherId']): SessionTeacherDTO {
  // teacherId is required + cascade-deleted (see User model). If a session is
  // ever loaded with a missing/null teacher, that's a data-integrity bug — let
  // it surface loudly rather than silently rendering a blank author.
  if (typeof t === 'string' || !('name' in (t as RawTeacher))) {
    return {
      _id: asString(t as { toString(): string } | string),
      name: '',
      avatar: null,
      role: 'teacher',
      isVerifiedTeacher: false,
    };
  }
  const raw = t as RawTeacher;
  return {
    _id: asString(raw._id),
    name: raw.name,
    avatar: raw.avatar ?? null,
    role: raw.role,
    isVerifiedTeacher: Boolean(raw.isVerifiedTeacher),
  };
}

interface ToDtoOptions {
  isEnrolled?: boolean;
  isOwner?: boolean;
  /** When false, omit meetingUrl from the response (default false). */
  includeMeetingUrl?: boolean;
}

export function sessionToDTO(
  raw: RawSession,
  opts: ToDtoOptions = {}
): SessionDTO {
  const { isEnrolled, isOwner, includeMeetingUrl = false } = opts;
  const dto: SessionDTO = {
    _id: asString(raw._id),
    title: raw.title,
    description: raw.description,
    teacher: asTeacher(raw.teacherId),
    subject: raw.subject,
    topics: raw.topics ?? [],
    exerciseIds: (raw.exerciseIds ?? []).map(asString),
    scheduledAt:
      raw.scheduledAt instanceof Date
        ? raw.scheduledAt.toISOString()
        : String(raw.scheduledAt),
    durationMinutes: raw.durationMinutes,
    capacity: raw.capacity,
    priceDA: raw.priceDA,
    status: raw.status,
    enrolledCount: raw.enrolledCount,
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt),
    updatedAt:
      raw.updatedAt instanceof Date
        ? raw.updatedAt.toISOString()
        : String(raw.updatedAt),
  };
  if (includeMeetingUrl) {
    dto.meetingUrl = raw.meetingUrl;
  }
  if (typeof isEnrolled === 'boolean') dto.isEnrolled = isEnrolled;
  if (typeof isOwner === 'boolean') dto.isOwner = isOwner;
  return dto;
}
