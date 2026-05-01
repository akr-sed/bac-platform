import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { FeedList } from '@/components/exercises/feed-list';
import { SubjectPrompt } from '@/components/exercises/subject-prompt';
import { UpcomingSessionsRail } from '@/components/sessions/upcoming-sessions-rail';
import { TeacherSessionsSection } from '@/components/sessions/teacher-sessions-section';
import { getSession } from '@/lib/auth';
import { fetchSessionsList } from '@/lib/sessions';
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

  // Single server-side fetch for upcoming sessions, used by both rails. The
  // rail and the teacher section used to do uncoordinated client fetches on
  // mount → 3 round trips on first paint. Now they receive pre-rendered data.
  const [upcomingResult, teacherResult] = await Promise.all([
    fetchSessionsList({
      upcoming: true,
      limit: 5,
      viewerUserId: auth?.userId ?? null,
    }),
    isTeacher && auth
      ? fetchSessionsList({
          teacherId: auth.userId,
          limit: 10,
          viewerUserId: auth.userId,
        })
      : Promise.resolve({ data: [], total: 0, page: 1, totalPages: 1 }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {isTeacher && auth && (
        <TeacherSessionsSection sessions={teacherResult.data} />
      )}

      <UpcomingSessionsRail sessions={upcomingResult.data} />

      <h1 className="mb-6 font-heading text-2xl font-bold">{t('feedTitle')}</h1>
      {items.length === 0 ? (
        <SubjectPrompt />
      ) : (
        <FeedList initialItems={items} endpoint="/api/feed" />
      )}
    </main>
  );
}
