import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { buttonVariants } from '@/components/ui/button';
import { SessionsList } from '@/components/sessions/sessions-list';
import { getSession } from '@/lib/auth';
import { fetchSessionsList } from '@/lib/sessions';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/layout/AppShell';

export default async function SessionsPage() {
  const t = await getTranslations('sessions');
  const auth = await getSession();
  const { data: sessions } = await fetchSessionsList({
    upcoming: true,
    limit: 30,
    viewerUserId: auth?.userId ?? null,
  });
  const canCreate = auth?.role === 'teacher' || auth?.role === 'admin';

  return (
    <AppShell>
    <main className="py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('upcoming')}</p>
        </div>
        {canCreate && (
          <Link
            href="/sessions/new"
            className={cn(buttonVariants(), 'cursor-pointer gap-2 rounded-xl')}
          >
            <Plus className="size-4" />
            {t('create')}
          </Link>
        )}
      </div>
      <SessionsList initialSessions={sessions} />
    </main>
    </AppShell>
  );
}
