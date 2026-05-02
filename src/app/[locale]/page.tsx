import { getSession } from '@/lib/auth';
import { Landing } from '@/components/landing/Landing';
import { HomeFeed } from '@/components/feed/HomeFeed';

type Params = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Params) {
  const { locale } = await params;
  const session = await getSession();

  if (session) {
    return (
      <HomeFeed
        userId={session.userId}
        userName={session.name}
        locale={locale}
      />
    );
  }

  return <Landing />;
}
