import { redirect } from 'next/navigation';

// /[locale] now serves the personalized feed when authed, making this
// route redundant. Permanent redirect to keep old links working.
export default async function DashboardRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
