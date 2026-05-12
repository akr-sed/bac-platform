import { getSession } from '@/lib/auth';
import { MarketingLanding } from '@/components/landing/MarketingLanding';
import { HomeFeed } from '@/components/feed/HomeFeed';
import { parseFeedSort } from '@/lib/feed-ranking';

type SearchParams = Promise<{ sort?: string }>;
type Params = {
  params: Promise<{ locale: string }>;
  searchParams?: SearchParams;
};

export default async function HomePage({ params, searchParams }: Params) {
  const { locale } = await params;
  const search = (await searchParams) ?? {};
  const sort = parseFeedSort(search.sort);
  const session = await getSession();

  if (session) {
    return (
      <HomeFeed
        userId={session.userId}
        userName={session.name}
        userRole={session.role}
        locale={locale}
        sort={sort}
      />
    );
  }

  return <MarketingLanding locale={locale} />;
}
