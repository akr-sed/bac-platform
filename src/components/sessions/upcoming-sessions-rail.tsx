import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ChevronRight } from 'lucide-react';
import { SessionCard } from './session-card';
import type { SessionDTO } from '@/types';

interface Props {
  /**
   * Pre-fetched sessions, supplied by the parent server page. We deliberately
   * do not fetch here so the dashboard can de-duplicate this list against the
   * teacher-sessions section (a single server-side query, not three competing
   * client-side fetches on first paint).
   */
  sessions: SessionDTO[];
}

/**
 * Server component. The rail used to be a client island that did its own
 * `fetch('/api/sessions?upcoming=true...')` on mount, which compounded with
 * the teacher-section fetch and the page's own fetch into three round trips
 * on first paint. Now the parent page fetches once via `fetchSessionsList`
 * and passes the result down — no client JS, no extra latency.
 */
export async function UpcomingSessionsRail({ sessions }: Props) {
  const t = await getTranslations('sessions');

  if (sessions.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="upcoming-sessions-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="upcoming-sessions-heading"
          className="font-heading text-lg font-semibold"
        >
          {t('upcoming')}
        </h2>
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t('browse')}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
      <div
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
        role="list"
      >
        {sessions.map((s) => (
          <div role="listitem" key={s._id}>
            <SessionCard session={s} variant="rail" />
          </div>
        ))}
      </div>
    </section>
  );
}
