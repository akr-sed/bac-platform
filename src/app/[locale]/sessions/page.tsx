import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { buttonVariants } from '@/components/ui/button';
import { SessionsList } from '@/components/sessions/sessions-list';
import { getSession } from '@/lib/auth';
import { cn } from '@/lib/utils';
import type { SessionDTO } from '@/types';

async function fetchUpcomingSessions(): Promise<SessionDTO[]> {
  const h = await headers();
  const c = await cookies();
  const host = h.get('host');
  const protocol = h.get('x-forwarded-proto') ?? 'http';
  try {
    const res = await fetch(
      `${protocol}://${host}/api/sessions?upcoming=true&limit=30`,
      {
        cache: 'no-store',
        headers: { cookie: c.toString() },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []) as SessionDTO[];
  } catch {
    return [];
  }
}

export default async function SessionsPage() {
  const t = await getTranslations('sessions');
  const [sessions, auth] = await Promise.all([
    fetchUpcomingSessions(),
    getSession(),
  ]);
  const canCreate = auth?.role === 'teacher' || auth?.role === 'admin';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
  );
}
