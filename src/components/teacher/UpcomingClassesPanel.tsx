import { getTranslations } from 'next-intl/server';
import { Types } from 'mongoose';
import { Calendar, ChevronLeft, Pencil, Users, Video } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';
import { OwlIllustration } from '@/components/brand/OwlIllustration';
import { connectToDatabase } from '@/lib/mongodb';
import Session from '@/models/Session';
import SessionEnrollment from '@/models/SessionEnrollment';
import { cn } from '@/lib/utils';

interface Props {
  userId: string;
  locale: string;
}

interface EnrollmentLean {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  userId:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        name?: string;
        avatar?: string;
      };
}

interface UpcomingClassRow {
  id: string;
  title: string;
  subject: string;
  topic: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  enrolledCount: number;
  enrolledAvatars: { name: string; avatar?: string }[];
  isToday: boolean;
  enterRoomEligible: boolean;
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const UPCOMING_LIMIT = 5;

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

async function loadUpcoming(userId: string): Promise<UpcomingClassRow[]> {
  if (!Types.ObjectId.isValid(userId)) return [];
  await connectToDatabase();
  const teacherObjId = new Types.ObjectId(userId);
  const today = startOfTodayUtc();

  // Read the Session model — sessions are owned by the teacher via the
  // `teacherId` field. Live + scheduled sessions on/after today.
  const sessions = await Session.find({
    teacherId: teacherObjId,
    status: { $in: ['scheduled', 'live'] },
    scheduledAt: { $gte: today },
  })
    .sort({ scheduledAt: 1 })
    .limit(UPCOMING_LIMIT)
    .lean();

  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s._id);

  // Pull every enrollment for these sessions in a single query, then
  // group/limit/avatars per-session in memory — avoids N+1 fetches.
  const enrollments = (await SessionEnrollment.find({
    sessionId: { $in: sessionIds },
  })
    .populate({ path: 'userId', select: 'name avatar' })
    .lean()) as unknown as EnrollmentLean[];

  const enrollmentsBySession = new Map<string, EnrollmentLean[]>();
  for (const e of enrollments) {
    const key = String(e.sessionId);
    const list = enrollmentsBySession.get(key) ?? [];
    list.push(e);
    enrollmentsBySession.set(key, list);
  }

  const now = Date.now();

  return sessions.map((s) => {
    const id = String(s._id);
    const sessionEnrollments = enrollmentsBySession.get(id) ?? [];
    const enrolledAvatars = sessionEnrollments
      .slice(0, 3)
      .map((e) => {
        // The populate() expands `userId` from an ObjectId into a partial
        // User doc. We narrow by checking for the `name` field (ObjectId
        // instances don't expose it), keeping the lean-result typing happy.
        const u = e.userId as
          | { _id: Types.ObjectId; name?: string; avatar?: string }
          | Types.ObjectId;
        if (u && typeof u === 'object' && 'name' in u) {
          return { name: u.name ?? '', avatar: u.avatar };
        }
        return { name: '', avatar: undefined };
      });

    const startMs = new Date(s.scheduledAt).getTime();
    const enterRoomEligible =
      s.status === 'live' || startMs - now <= FIFTEEN_MINUTES_MS;

    // Use `enrolledCount` from the doc (denormalized, kept in sync via hooks)
    // rather than the in-memory enrollments length so cancellations and
    // unenrollments are reflected even if the join collection lags.
    const enrolledCount = typeof s.enrolledCount === 'number'
      ? s.enrolledCount
      : sessionEnrollments.length;

    return {
      id,
      title: s.title,
      subject: s.subject,
      topic: Array.isArray(s.topics) && s.topics.length > 0 ? s.topics[0] : '',
      scheduledAt: new Date(s.scheduledAt),
      durationMinutes: s.durationMinutes,
      meetingUrl: s.meetingUrl,
      status: s.status,
      enrolledCount,
      enrolledAvatars,
      isToday: isSameDay(new Date(s.scheduledAt), new Date()),
      enterRoomEligible,
    } satisfies UpcomingClassRow;
  });
}

function formatTimeRange(
  start: Date,
  durationMinutes: number,
  locale: string
): string {
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale !== 'ar' && locale !== 'fr',
    timeZone: 'Africa/Algiers',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/**
 * Server component. End-side panel on the teacher home page replacing the
 * student `GamificationSidebar`. Surfaces the teacher's next 5 scheduled
 * or live sessions with quick "Enter Room" / "Edit Time" CTAs.
 */
export async function UpcomingClassesPanel({ userId, locale }: Props) {
  const t = await getTranslations('teacher');
  const classes = await loadUpcoming(userId);

  return (
    <section
      aria-labelledby="upcoming-classes-heading"
      className="overflow-hidden rounded-[16px] border border-[#D9EFF8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      {/* Header — blue band, matches Figma "Upcoming Classes" widget */}
      <header className="flex items-center justify-between gap-2 bg-[#0095D1] px-4 py-3 text-white">
        <h2
          id="upcoming-classes-heading"
          className="inline-flex items-center gap-2 text-sm font-extrabold"
        >
          <Calendar className="size-4" aria-hidden="true" />
          {t('upcomingClasses.title')}
        </h2>
        {classes.some((c) => c.isToday) && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {t('upcomingClasses.today')}
          </span>
        )}
      </header>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <OwlIllustration variant="empty-feed" size={96} />
          <p className="text-sm text-muted-foreground">
            {t('upcomingClasses.noUpcoming')}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#D9EFF8]">
          {classes.map((c) => (
            <li key={c.id} className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#171C20]">
                    {c.subject}
                  </p>
                  {c.topic && (
                    <p className="truncate text-xs text-[#3E4850]">{c.topic}</p>
                  )}
                </div>
                <p className="shrink-0 text-end font-mono text-xs font-bold tabular-nums text-[#0095D1]">
                  {formatTimeRange(c.scheduledAt, c.durationMinutes, locale)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center">
                  {c.enrolledAvatars.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3.5" aria-hidden="true" />
                      <span className="font-mono tabular-nums">
                        {c.enrolledCount}
                      </span>
                    </span>
                  ) : (
                    <>
                      {c.enrolledAvatars.map((a, idx) => (
                        <span
                          key={`${c.id}-av-${idx}`}
                          className={cn(
                            'rounded-full ring-2 ring-white',
                            idx > 0 && '-ms-2'
                          )}
                        >
                          <UserAvatar
                            src={a.avatar}
                            name={a.name}
                            size="sm"
                          />
                        </span>
                      ))}
                      {c.enrolledCount > c.enrolledAvatars.length && (
                        <span className="-ms-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#F0F4F9] px-2 text-[11px] font-bold text-[#3E4850] ring-2 ring-white">
                          +{c.enrolledCount - c.enrolledAvatars.length}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {c.enterRoomEligible && c.meetingUrl ? (
                  <a
                    href={c.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#0095D1] px-3 text-xs font-extrabold text-white transition-colors hover:bg-[#007FB3]"
                  >
                    <Video className="size-3.5" aria-hidden="true" />
                    <span>{t('upcomingClasses.enterRoom')}</span>
                  </a>
                ) : (
                  <Link
                    href={`/sessions/${c.id}`}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-transparent px-3 text-xs font-bold text-[#0095D1] transition-colors hover:bg-[#D9EFF8]"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    <span>{t('upcomingClasses.editTime')}</span>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-[#D9EFF8] px-4 py-3">
        <Link
          href="/sessions"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-1 text-xs font-bold text-[#0095D1] transition-colors hover:text-[#00709D]"
        >
          {t('upcomingClasses.viewAll')}
          <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </footer>
    </section>
  );
}

export default UpcomingClassesPanel;
