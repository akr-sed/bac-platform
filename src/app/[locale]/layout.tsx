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
        {/* `flex flex-col flex-1` lets the page content (AppShell) stretch
            vertically between the navbar and the footer. The rail uses this
            stretched height to pin Settings just above the footer on short
            pages and to ride up correctly via sticky on long pages.
            Plain <div> (not <main>) — AppShell renders its own <main>. */}
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </div>
    </Providers>
  );
}
