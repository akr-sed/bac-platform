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

  // Teachers (and admins) get the teacher-specific home page: quick actions
  // at the top, a "Recent Student Questions" feed in the middle, and an
  // Upcoming Classes panel on the end-side. Students keep the existing
  // gamified feed.
  if (session.role === 'teacher' || session.role === 'admin') {
    return (
      <TeacherHomeFeed
        userId={session.userId}
        userName={session.name}
        locale={locale}
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
