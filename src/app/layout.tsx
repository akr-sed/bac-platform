import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
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
  const fontVars = `${geistSans.variable} ${geistMono.variable} ${plexArabic.variable}`;

  return (
    <html lang={locale} dir={dir} className={fontVars} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
