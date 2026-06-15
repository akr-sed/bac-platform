import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { OwlIllustration } from '@/components/brand/OwlIllustration';

type RouteParams = { params: Promise<{ locale: string }> };

/**
 * Teacher analytics dashboard placeholder.
 *
 * Gated to authenticated teachers/admins. Renders a small "coming soon" card
 * with the NAJAH owl until the full analytics surface lands.
 */
export default async function StatisticsPage({ params }: RouteParams) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }
  if (session.role !== 'teacher' && session.role !== 'admin') {
    redirect(`/${locale}`);
  }

  const t = await getTranslations('statistics');

  return (
    <AppShell>
      <div className="py-6 sm:py-8">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h1>
        </header>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-[16px] border border-[#D9EFF8] bg-white px-6 py-14 text-center shadow-sm">
          <OwlIllustration variant="empty-feed" size={160} />
          <div className="space-y-2">
            <p className="text-xl font-bold text-[#0095D1]">{t('comingSoon')}</p>
            <p className="max-w-md text-sm text-[#3E4850]">
              {t('comingSoonHint')}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
