import { Calendar, Clock, Radio, Users } from 'lucide-react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type { SessionDTO } from '@/types';

interface Props {
  session: SessionDTO;
  variant?: 'rail' | 'full';
}

export function SessionCard({ session, variant = 'full' }: Props) {
  const t = useTranslations('sessions');
  const locale = useLocale();
  const format = useFormatter();

  const date = new Date(session.scheduledAt);
  const isCancelled = session.status === 'cancelled';
  const remaining =
    session.capacity != null
      ? Math.max(0, session.capacity - session.enrolledCount)
      : null;

  const dateLabel = format.dateTime(date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isRail = variant === 'rail';

  return (
    <Link
      href={`/sessions/${session._id}` as `/sessions/${string}`}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm ring-1 ring-foreground/5 transition hover:shadow-md',
        isCancelled && 'opacity-60',
        isRail ? 'w-72 shrink-0' : 'w-full'
      )}
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Radio className="size-3" />
          {t('liveBadge')}
        </span>
        <span className="text-sm font-bold text-foreground">
          {session.priceDA > 0
            ? t('priceDA', { price: session.priceDA })
            : t('free')}
        </span>
      </div>

      <div className="px-4 pb-4 pt-3">
        <h3
          className={cn(
            'line-clamp-2 font-heading font-semibold leading-snug text-foreground',
            isRail ? 'text-base' : 'text-lg'
          )}
        >
          {session.title}
        </h3>

        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <UserAvatar
            src={session.teacher.avatar}
            name={session.teacher.name}
            size="sm"
          />
          <span className="truncate font-medium text-foreground">
            {session.teacher.name}
          </span>
          {session.teacher.isVerifiedTeacher && (
            <span
              className="inline-flex size-4 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary"
              aria-label="Verified teacher"
            >
              ✓
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-primary" />
            <time dateTime={session.scheduledAt} suppressHydrationWarning>
              {dateLabel}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-primary" />
            <span>
              {t('duration', { minutes: session.durationMinutes })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-primary" />
            {session.capacity != null ? (
              remaining !== null && remaining > 0 ? (
                <span>
                  {t('spotsLeft', {
                    remaining,
                    total: session.capacity,
                  })}
                </span>
              ) : (
                <span className="font-semibold text-destructive">
                  {t('full')}
                </span>
              )
            ) : (
              <span>
                {t('spotsUnlimited', { enrolled: session.enrolledCount })}
              </span>
            )}
          </div>
        </div>

        {!isRail && session.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {session.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                lang={locale}
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {isCancelled && (
          <div className="mt-3 rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
            {t('cancelled')}
          </div>
        )}
      </div>
    </Link>
  );
}
