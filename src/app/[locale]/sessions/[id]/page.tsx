import { notFound } from 'next/navigation';
import { getTranslations, getFormatter } from 'next-intl/server';
import { BadgeCheck, Calendar, Clock, ExternalLink, Radio, Users, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EnrollButton } from '@/components/sessions/enroll-button';
import { getSession } from '@/lib/auth';
import { fetchSessionById } from '@/lib/sessions';

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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
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

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-card to-secondary/10 px-6 py-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Radio className="size-3" />
              {t('liveBadge')}
            </span>
            <span className="text-lg font-bold text-foreground">
              {session.priceDA > 0
                ? t('priceDA', { price: session.priceDA })
                : t('free')}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {session.title}
          </h1>
          {session.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {session.description}
            </p>
          )}
        </div>

        <div className="border-t border-border px-6 py-6">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={session.teacher.avatar}
              name={session.teacher.name}
              size="md"
            />
            <div>
              <p className="font-semibold">{session.teacher.name}</p>
              {session.teacher.isVerifiedTeacher && (
                <p className="inline-flex items-center gap-1 text-xs text-primary">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  {t('verifiedTeacher')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border px-6 py-5 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                {t('scheduledFor')}
              </p>
              <time dateTime={session.scheduledAt} suppressHydrationWarning>
                {dateLabel}
              </time>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                {t('durationLabel')}
              </p>
              <span>{t('duration', { minutes: session.durationMinutes })}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                {t('capacityLabel')}
              </p>
              <span>
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
          <div className="border-t border-border px-6 py-5">
            <p className="mb-2 text-xs uppercase text-muted-foreground">
              {t('topicsLabel')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {session.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md bg-muted px-2.5 py-1 text-sm text-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border bg-muted/30 px-6 py-5">
          {session.meetingUrl ? (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="size-4" />
              {t('openMeeting')}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('meetingHidden')}
            </p>
          )}
        </div>

        <div className="border-t border-border px-6 py-5">
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
    </main>
  );
}
