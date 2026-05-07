import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/components/providers/Providers';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <Providers messages={messages as Record<string, unknown>} locale={locale}>
      <div className="flex min-h-[100dvh] flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </Providers>
  );
}
