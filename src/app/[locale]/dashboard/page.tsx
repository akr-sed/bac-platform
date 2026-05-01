import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { FeedList } from '@/components/exercises/feed-list';
import { SubjectPrompt } from '@/components/exercises/subject-prompt';
import { UpcomingSessionsRail } from '@/components/sessions/upcoming-sessions-rail';
import { TeacherSessionsSection } from '@/components/sessions/teacher-sessions-section';
import { getSession } from '@/lib/auth';
import type { FeedItemDTO } from '@/types';

async function fetchInitialFeed(): Promise<{
  items: FeedItemDTO[];
  hasMore: boolean;
}> {
  const h = await headers();
  const c = await cookies();
  const host = h.get('host');
  const protocol = h.get('x-forwarded-proto') ?? 'http';
  try {
    const res = await fetch(
      `${protocol}://${host}/api/feed?page=0&limit=10`,
      {
        cache: 'no-store',
        headers: { cookie: c.toString() },
      }
    );
    if (!res.ok) return { items: [], hasMore: false };
    const data = await res.json();
    return { items: data.data ?? [], hasMore: Boolean(data.hasMore) };
  } catch {
    return { items: [], hasMore: false };
  }
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const [{ items }, auth] = await Promise.all([
    fetchInitialFeed(),
    getSession(),
  ]);
  const isTeacher = auth?.role === 'teacher' || auth?.role === 'admin';

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {isTeacher && auth && (
        <TeacherSessionsSection teacherId={auth.userId} />
      )}

      <UpcomingSessionsRail />

      <h1 className="mb-6 font-heading text-2xl font-bold">{t('feedTitle')}</h1>
      {items.length === 0 ? (
        <SubjectPrompt />
      ) : (
        <FeedList initialItems={items} endpoint="/api/feed" />
      )}
    </main>
  );
}
