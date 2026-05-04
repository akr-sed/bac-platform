import { notFound } from 'next/navigation';
import { getTranslations, getFormatter } from 'next-intl/server';
import { BadgeCheck, Calendar, Clock, ExternalLink, Radio, Users, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EnrollButton } from '@/components/sessions/enroll-button';
import { getSession } from '@/lib/auth';
import { fetchSessionById } from '@/lib/sessions';
import { AppShell } from '@/components/layout/AppShell';

interface Props {
  params: Promise<{ id: string }>;
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

  // Render the time in Africa/Algiers (the platform's primary audience) with
  // an explicit short time-zone label so cross-locale users aren't left
  // guessing which clock the session is on. Without `timeZoneName`, the
  // formatter silently falls back to the runtime default which is wrong on
  // Vercel (UTC) and ambiguous in the UI.
  const dateLabel = format.dateTime(date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Algiers',
    timeZoneName: 'short',
  });

  return (
    <AppShell>
    <div className="py-8">
      {isCancelled && (
        // Solid red banner: white text on the destructive token gives
        // ≥4.5:1 in light mode, and the dark-mode destructive is darkened
        // to keep the same contrast against the lighter foreground.
        // (Default `bg-destructive/10 text-destructive` was ~3.2:1 in
        // light mode — below AA.)
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-lg border border-destructive bg-destructive px-4 py-3 text-sm font-semibold text-white shadow-sm dark:bg-[oklch(0.50_0.22_27)] dark:border-[oklch(0.50_0.22_27)]"
        >
          <XCircle className="size-4 shrink-0" aria-hidden="true" />
          {t('cancelled')}
        </div>
      )}

      <Card className="overflow-hidden rounded-3xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="bg-gradient-to-br from-primary/[0.06] via-card to-card px-7 py-9">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-xs font-medium text-primary">
              <Radio className="size-3" />
              {t('liveBadge')}
            </span>
            <span className="font-mono text-base font-semibold tabular-nums text-foreground">
              {session.priceDA > 0
                ? t('priceDA', { price: session.priceDA })
                : t('free')}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {session.title}
          </h1>
          {session.description && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {session.description}
            </p>
          )}
        </div>

        <div className="border-t border-border px-7 py-5">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={session.teacher.avatar}
              name={session.teacher.name}
              size="md"
            />
            <div>
              <p className="font-medium text-foreground">{session.teacher.name}</p>
              {session.teacher.isVerifiedTeacher && (
                <p className="inline-flex items-center gap-1 text-xs text-primary">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  {t('verifiedTeacher')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-3">
          <div className="flex items-start gap-3 bg-card px-7 py-5">
            <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t('scheduledFor')}
              </p>
              <time className="mt-1 block text-sm font-medium text-foreground" dateTime={session.scheduledAt} suppressHydrationWarning>
                {dateLabel}
              </time>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-card px-7 py-5">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t('durationLabel')}
              </p>
              <span className="mt-1 block font-mono text-sm font-medium tabular-nums text-foreground">{t('duration', { minutes: session.durationMinutes })}</span>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-card px-7 py-5">
            <Users className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t('capacityLabel')}
              </p>
              <span className="mt-1 block font-mono text-sm font-medium tabular-nums text-foreground">
                {session.capacity != null
                  ? t('spotsTotal', {
                      enrolled: session.enrolledCount,
                      capacity: session.capacity,
                    })
                  : t('spotsUnlimited', {
                      enrolled: session.enrolledCount,
                    })}
              </span>
            </div>
          </div>
        </div>

        {session.topics.length > 0 && (
          <div className="border-t border-border px-7 py-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {t('topicsLabel')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {session.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border bg-muted/30 px-7 py-5">
          {session.meetingUrl ? (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              <ExternalLink className="size-4" />
              <span className="border-b border-transparent group-hover:border-primary">
                {t('openMeeting')}
              </span>
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('meetingHidden')}
            </p>
          )}
        </div>

        <div className="border-t border-border px-7 py-5">
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
      </Card>
    </div>
    </AppShell>
  );
}
