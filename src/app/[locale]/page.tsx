import { getSession } from '@/lib/auth';
import { MarketingLanding } from '@/components/landing/MarketingLanding';
import { HomeFeed } from '@/components/feed/HomeFeed';
import { TeacherHomeFeed } from '@/components/feed/TeacherHomeFeed';
import { parseFeedFilter, parseFeedSort } from '@/lib/feed-ranking';

type SearchParams = Promise<{ sort?: string; filter?: string }>;
type Params = {
  params: Promise<{ locale: string }>;
  searchParams?: SearchParams;
};

export default async function HomePage({ params, searchParams }: Params) {
  const { locale } = await params;
  const search = (await searchParams) ?? {};
  const sort = parseFeedSort(search.sort);
  const filter = parseFeedFilter(search.filter);
  const session = await getSession();

  if (!session) {
    return <MarketingLanding locale={locale} />;
  }

  // Teachers (and admins) get a slightly different shell: QuickActionBar
  // above the feed and UpcomingClassesPanel on the end-side. The feed
  // content itself is identical to the student feed (same sort/filter
  // tabs, same cards).
  if (session.role === 'teacher' || session.role === 'admin') {
    return (
      <TeacherHomeFeed
        userId={session.userId}
        userName={session.name}
        locale={locale}
        sort={sort}
        filter={filter}
      />
    );
  }

  return (
    <HomeFeed
      userId={session.userId}
      userName={session.name}
      userRole={session.role}
      locale={locale}
      sort={sort}
      filter={filter}
    />
  );
}
