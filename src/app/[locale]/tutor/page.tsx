import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { AIDisclaimerBanner } from '@/components/ui/ai-disclaimer-banner';
import { TutorTabs } from '@/components/tutor/TutorTabs';

type RouteParams = { params: Promise<{ locale: string }> };

export default async function TutorPage({ params }: RouteParams) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations('tutor');

  return (
    <AppShell>
      <div className="space-y-6 py-6 sm:py-8">
        <header className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h1>
          <p className="max-w-2xl text-sm text-[#3E4850] sm:text-base">
            {t('subtitle')}
          </p>
        </header>

        <AIDisclaimerBanner message={t('preview')} />

        <TutorTabs />
      </div>
    </AppShell>
  );
}
