'use client';

import { BadgeCheck, Calendar, Users } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type { SessionDTO } from '@/types';

/**
 * SessionCard — "Classroom Notice" design (Concept B).
 *
 * Visual sibling of <ExerciseCard>: same anatomy (subject pill on start,
 * teacher meta on end, body with hero block + topics, footer CTA + price)
 * so sessions and exercises feel like one family in the feed.
 *
 * Variants:
 *   - "full" (default): grid card with hero time block + topics + footer CTA
 *   - "rail":           narrow 288 px column for horizontal scroll rails
 */
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

function relativeFromNow(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now();
  const min = Math.round(diff / 60000);
  if (min < 0) return null;
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

interface Props {
  session: SessionDTO;
  variant?: 'full' | 'rail';
}

export function SessionCard({ session, variant = 'full' }: Props) {
  const t = useTranslations('sessions');
  const locale = useLocale();
  const fmt = useFormatter();

  const subj = subjectStyles(session.subject);
  const date = new Date(session.scheduledAt);
  const dateLabel = fmt.dateTime(date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Algiers',
  });
  const timeLabel = fmt.dateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Algiers',
  });
  const countdown = relativeFromNow(session.scheduledAt);

  const cap = session.capacity ?? 0;
  const remaining = cap > 0 ? Math.max(0, cap - session.enrolledCount) : null;
  const isCancelled = session.status === 'cancelled';
  const isLive = session.status === 'live';
  const href = `/sessions/${session._id}` as `/sessions/${string}`;

  if (variant === 'rail') {
    // Compact rail variant for horizontal-scroll lists / sidebar widgets.
    return (
      <Link
        href={href}
        className={cn(
          'flex w-72 shrink-0 flex-col overflow-hidden rounded-[12px] border border-[#D9EFF8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]',
          isCancelled && 'opacity-60'
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize',
              subj.bg,
              subj.text
            )}
          >
            {session.subject}
          </span>
          <span className="font-mono text-[11px] font-bold tabular-nums text-[#003449]">
            {session.priceDA > 0 ? t('priceDA', { price: session.priceDA }) : t('free')}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-end text-sm font-extrabold leading-tight text-[#171C20]">
            {session.title}
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <UserAvatar src={session.teacher.avatar} name={session.teacher.name} size="sm" />
            <span className="truncate font-semibold text-[#3E4850]">
              {session.teacher.name}
            </span>
            {session.teacher.isVerifiedTeacher && (
              <BadgeCheck className="size-3 shrink-0 text-[#0095D1]" />
            )}
          </div>
          <div className="flex-1" />
          <div
            className={cn(
              'mt-3 flex items-center justify-between rounded-[8px] px-2.5 py-2',
              subj.tint
            )}
          >
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#003449]">
              <Calendar className="size-3 text-[#0095D1]" />
              {dateLabel} · {timeLabel}
            </span>
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#ED2D30]">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ED2D30] opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#ED2D30]" />
                </span>
                {t('liveBadge')}
              </span>
            ) : countdown ? (
              <span className="text-[10px] font-bold text-[#0095D1]">
                {t('inLabel', { time: countdown })}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    );
  }

  // Full grid variant.
  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-[12px] border border-[#D9EFF8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]',
        isCancelled && 'opacity-60'
      )}
    >
      {/* Header — mirrors ExerciseCard */}
      <header className="flex items-center justify-between gap-3 border-b border-[#D9EFF8] px-5 pt-5 pb-[21px]">
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
              size="sm"
            />
            {session.teacher.isVerifiedTeacher && (
              <BadgeCheck className="absolute -bottom-0.5 -end-0.5 size-3.5 rounded-full bg-white text-[#0095D1]" />
            )}
          </div>
        </div>
      </header>

      <Link href={href} className="flex flex-1 flex-col p-6">
        <h3 className="line-clamp-2 min-h-[3.25rem] text-end text-[17px] font-extrabold leading-tight text-[#171C20]">
          {session.title}
        </h3>

        {/* Hero time block — replaces math expression / image block in ExerciseCard */}
        <div
          className={cn(
            'mt-4 flex items-center justify-between rounded-[12px] border border-[rgba(223,227,232,0.5)] px-5 py-4',
            subj.tint
          )}
        >
          <div className="flex items-center gap-2.5 text-[#003449]">
            <Calendar className="size-5 text-[#0095D1]" />
            <div>
              <p className="text-[13px] font-extrabold tabular-nums">{dateLabel}</p>
              <p className="text-[11px] font-semibold text-[#3E4850]">
                {timeLabel} · {t('duration', { minutes: session.durationMinutes })}
              </p>
            </div>
          </div>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ED2D30] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-white" />
              </span>
              {t('liveBadge')}
            </span>
          ) : countdown ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#0095D1] ring-1 ring-[#D9EFF8]">
              {t('inLabel', { time: countdown })}
            </span>
          ) : null}
        </div>

        {/* Topics */}
        {session.topics.length > 0 && (
          <div className="mt-4 flex max-h-[2rem] flex-wrap gap-1.5 overflow-hidden">
            {session.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-md bg-[#F0F4F9] px-2 py-0.5 text-xs text-[#3E4850]"
                lang={locale}
              >
                {topic}
              </span>
            ))}
            {session.topics.length > 3 && (
              <span className="rounded-md bg-[#F0F4F9] px-2 py-0.5 text-xs text-[#3E4850]">
                +{session.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[#D9EFF8] px-6 py-4">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#0095D1] px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-[#00709D]"
        >
          {isLive ? t('joinNow') : t('reserveSeat')}
        </Link>

        <div className="flex items-center gap-3 text-xs font-bold text-[#3E4850]">
          {cap > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              <span className="font-mono tabular-nums">
                {remaining}/{cap}
              </span>
            </span>
          )}
          <span className="font-mono tabular-nums text-[#003449]">
            {session.priceDA > 0 ? t('priceDA', { price: session.priceDA }) : t('free')}
          </span>
        </div>
      </footer>
    </article>
  );
}
