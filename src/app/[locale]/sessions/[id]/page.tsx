import { notFound } from 'next/navigation';
import { getTranslations, getFormatter } from 'next-intl/server';
import {
  BadgeCheck,
  Calendar,
  Clock,
  ExternalLink,
  Users,
  XCircle,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EnrollButton } from '@/components/sessions/enroll-button';
import { getSession } from '@/lib/auth';
import { fetchSessionById } from '@/lib/sessions';
import { AppShell } from '@/components/layout/AppShell';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; tint: string }> = {
  math:        { bg: 'bg-[#7ECCFE]', text: 'text-[#00709D]', tint: 'bg-[#E6F4FA]' },
  رياضيات:    { bg: 'bg-[#7ECCFE]', text: 'text-[#00709D]', tint: 'bg-[#E6F4FA]' },
  physics:     { bg: 'bg-[#FFDCBF]', text: 'text-[#6B3B00]', tint: 'bg-[#FFF7ED]' },
  فيزياء:     { bg: 'bg-[#FFDCBF]', text: 'text-[#6B3B00]', tint: 'bg-[#FFF7ED]' },
  chemistry:   { bg: 'bg-[#D9EFF8]', text: 'text-[#0095D1]', tint: 'bg-[#F0F9FE]' },
  كيمياء:     { bg: 'bg-[#D9EFF8]', text: 'text-[#0095D1]', tint: 'bg-[#F0F9FE]' },
  biology:     { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', tint: 'bg-[#F0FDF4]' },
  'علوم طبيعية': { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', tint: 'bg-[#F0FDF4]' },
};

function subjectStyles(subject: string) {
  return (
    SUBJECT_COLORS[subject.toLowerCase()] ?? {
      bg: 'bg-[#EAEEF3]',
      text: 'text-[#3E4850]',
      tint: 'bg-[#F0F4F9]',
    }
  );
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('sessions');
  const format = await getFormatter();
  const auth = await getSession();
  const session = await fetchSessionById(id, auth?.userId ?? null);
  if (!session) notFound();

  const date = new Date(session.scheduledAt);
  const isCancelled = session.status === 'cancelled';
  const isLive = session.status === 'live';
  const subj = subjectStyles(session.subject);

  const dateLabel = format.dateTime(date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Algiers',
  });
  const timeLabel = format.dateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Algiers',
    timeZoneName: 'short',
  });

  const cap = session.capacity ?? 0;
  const remaining = cap > 0 ? Math.max(0, cap - session.enrolledCount) : null;

  return (
    <AppShell>
      <div className="py-8">
        {/* Cancelled banner */}
        {isCancelled && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#ED2D30] bg-[#ED2D30] px-4 py-3 text-sm font-bold text-white shadow-sm"
          >
            <XCircle className="size-4 shrink-0" aria-hidden="true" />
            {t('cancelled')}
          </div>
        )}

        <article className="overflow-hidden rounded-[12px] border border-[#D9EFF8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {/* Header — mirrors SessionCard / ExerciseCard */}
          <header className="flex items-center justify-between gap-3 border-b border-[#D9EFF8] px-7 pt-6 pb-[21px]">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold capitalize',
                subj.bg,
                subj.text
              )}
            >
              {session.subject}
            </span>

            <div className="flex items-center gap-2">
              <div className="text-end">
                <p className="text-sm font-semibold text-[#171C20]">
                  {session.teacher.name}
                </p>
                <p className="text-xs text-[#3E4850]">
                  {session.teacher.isVerifiedTeacher
                    ? t('verifiedTeacher')
                    : t('teacher')}
                </p>
              </div>
              <div className="relative">
                <UserAvatar
                  src={session.teacher.avatar}
                  name={session.teacher.name}
                  size="md"
                />
                {session.teacher.isVerifiedTeacher && (
                  <BadgeCheck className="absolute -bottom-0.5 -end-0.5 size-4 rounded-full bg-white text-[#0095D1]" />
                )}
              </div>
            </div>
          </header>

          {/* Title + description */}
          <div className="px-7 py-7">
            <h1 className="text-end text-3xl font-extrabold leading-tight text-[#171C20] sm:text-4xl">
              {session.title}
            </h1>
            {session.description && (
              <p className="mt-4 text-end text-base leading-relaxed text-[#3E4850]">
                {session.description}
              </p>
            )}
          </div>

          {/* Hero time block */}
          <div className="px-7 pb-7">
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[rgba(223,227,232,0.5)] px-6 py-5',
                subj.tint
              )}
            >
              <div className="flex items-center gap-3 text-[#003449]">
                <Calendar className="size-6 text-[#0095D1]" />
                <div>
                  <p className="text-[15px] font-extrabold tabular-nums">
                    {dateLabel}
                  </p>
                  <p className="text-xs font-semibold text-[#3E4850]">
                    {timeLabel} ·{' '}
                    {t('duration', { minutes: session.durationMinutes })}
                  </p>
                </div>
              </div>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ED2D30] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-white" />
                  </span>
                  {t('liveBadge')}
                </span>
              )}
            </div>
          </div>

          {/* Three-up info row */}
          <div className="grid gap-px border-t border-[#D9EFF8] bg-[#D9EFF8] sm:grid-cols-3">
            <div className="flex items-start gap-3 bg-white px-7 py-5">
              <Clock className="mt-0.5 size-4 shrink-0 text-[#0095D1]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3E4850]">
                  {t('durationLabel')}
                </p>
                <span className="mt-1 block font-mono text-sm font-bold tabular-nums text-[#003449]">
                  {t('duration', { minutes: session.durationMinutes })}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white px-7 py-5">
              <Users className="mt-0.5 size-4 shrink-0 text-[#0095D1]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3E4850]">
                  {t('capacityLabel')}
                </p>
                <span className="mt-1 block font-mono text-sm font-bold tabular-nums text-[#003449]">
                  {session.capacity != null
                    ? t('spotsTotal', {
                        enrolled: session.enrolledCount,
                        capacity: session.capacity,
                      })
                    : t('spotsUnlimited', {
                        enrolled: session.enrolledCount,
                      })}
                </span>
                {remaining !== null && remaining <= 5 && remaining > 0 && (
                  <span className="mt-1 inline-block rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-bold text-[#EA580C]">
                    {t('spotsLeft', { remaining, total: cap })}
                  </span>
                )}
                {remaining === 0 && (
                  <span className="mt-1 inline-block rounded-full bg-[#FEEAEA] px-2 py-0.5 text-[10px] font-bold text-[#ED2D30]">
                    {t('full')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white px-7 py-5">
              <Calendar className="mt-0.5 size-4 shrink-0 text-[#0095D1]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3E4850]">
                  {t('priceLabel')}
                </p>
                <span className="mt-1 block font-mono text-sm font-bold tabular-nums text-[#003449]">
                  {session.priceDA > 0
                    ? t('priceDA', { price: session.priceDA })
                    : t('free')}
                </span>
              </div>
            </div>
          </div>

          {/* Topics */}
          {session.topics.length > 0 && (
            <div className="border-t border-[#D9EFF8] px-7 py-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3E4850]">
                {t('topicsLabel')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {session.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-md bg-[#F0F4F9] px-2.5 py-1 text-xs font-semibold text-[#003449]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meeting URL (only visible to enrolled / owner) */}
          <div className="border-t border-[#D9EFF8] bg-[#F9FBFD] px-7 py-5">
            {session.meetingUrl ? (
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-sm font-extrabold text-[#0095D1] hover:text-[#00709D]"
              >
                <ExternalLink className="size-4" />
                <span className="border-b border-transparent group-hover:border-[#0095D1]">
                  {t('openMeeting')}
                </span>
              </a>
            ) : (
              <p className="text-sm text-[#3E4850]">{t('meetingHidden')}</p>
            )}
          </div>

          {/* Enroll CTA */}
          <div className="border-t border-[#D9EFF8] px-7 py-6">
            <EnrollButton
              sessionId={session._id}
              initialEnrolled={Boolean(session.isEnrolled)}
              initialEnrolledCount={session.enrolledCount}
              capacity={session.capacity}
              isOwner={Boolean(session.isOwner)}
              isAuthenticated={Boolean(auth)}
              isCancelled={isCancelled}
            />
          </div>
        </article>
      </div>
    </AppShell>
  );
}
