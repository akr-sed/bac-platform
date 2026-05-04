import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Trophy } from 'lucide-react';
import { LeaderboardClient } from './leaderboard-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard' });
  return { title: t('title') };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations('leaderboard');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[12px] bg-[#FFF3CD]">
          <Trophy className="size-5 text-[#D4A017]" />
        </span>
        <h1 className="font-extrabold text-2xl text-[#003449]">{t('title')}</h1>
      </div>
      <p className="mb-8 text-sm text-[#6D7D8B]">{t('description')}</p>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 rounded-[16px] bg-[#F0F4F8] animate-pulse" />
            ))}
          </div>
        }
      >
        <LeaderboardClient />
      </Suspense>
    </main>
  );
}
