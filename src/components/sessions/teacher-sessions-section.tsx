import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { SessionCard } from './session-card';
import { cn } from '@/lib/utils';
import type { SessionDTO } from '@/types';

interface Props {
  /**
   * Pre-fetched teacher sessions, supplied by the parent server page. See
   * the rail component for the rationale — we no longer fetch on mount in a
   * client island; the dashboard does it once server-side and passes it in.
   */
  sessions: SessionDTO[];
}

/**
 * Server component variant of the teacher-only "My Sessions" rail on the
 * dashboard.
 */
export async function TeacherSessionsSection({ sessions }: Props) {
  const t = await getTranslations('sessions');

  return (
    <section className="mb-8" aria-labelledby="teacher-sessions-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="teacher-sessions-heading"
          className="font-heading text-lg font-semibold"
        >
          {t('mySessions')}
        </h2>
        <Link
          href="/sessions/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'cursor-pointer gap-1.5'
          )}
        >
          <Plus className="size-4" />
          {t('create')}
        </Link>
      </div>
      {sessions.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {t('noSessions')}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sessions.map((s) => (
            <SessionCard key={s._id} session={s} />
          ))}
        </div>
      )}
    </section>
  );
}
