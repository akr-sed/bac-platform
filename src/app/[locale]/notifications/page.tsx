import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Bell } from 'lucide-react';
import { NotificationsList } from './notifications-list';
import { AppShell } from '@/components/layout/AppShell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notifications' });
  return { title: t('title') };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // locale resolved by layout
  const t = await getTranslations('notifications');

  return (
    <AppShell>
    <main className="py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[12px] bg-[#E6F4FA]">
          <Bell className="size-5 text-[#0095D1]" />
        </span>
        <h1 className="font-extrabold text-2xl text-[#003449]">{t('title')}</h1>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-[16px] bg-[#E6F4FA] animate-pulse" />
            ))}
          </div>
        }
      >
        <NotificationsList />
      </Suspense>
    </main>
    </AppShell>
  );
}
