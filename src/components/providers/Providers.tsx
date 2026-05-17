'use client';

import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { HtmlLocaleSync } from '@/components/providers/HtmlLocaleSync';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export function Providers({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="Africa/Algiers">
      <HtmlLocaleSync />
      <AuthProvider>
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
