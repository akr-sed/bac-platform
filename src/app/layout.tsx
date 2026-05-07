import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Mulish, Rubik } from 'next/font/google';
import { RootThemeProvider } from '@/components/providers/RootThemeProvider';
import './globals.css';

const mulish = Mulish({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Najah — منصة البكالوريا',
  description: 'تمارين بكالوريا، حلول جماعية، وجلسات مع الأساتذة. كلّ ما تحتاجه للتفوّق.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const fontVars = `${mulish.variable} ${rubik.variable}`;

  return (
    <html lang={locale} dir={dir} className={fontVars} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <RootThemeProvider>{children}</RootThemeProvider>
      </body>
    </html>
  );
}
