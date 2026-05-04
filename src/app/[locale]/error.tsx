'use client';

// Locale-aware error boundary — MUST be a client component per Next.js conventions.

import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ reset }: ErrorPageProps) {
  // useTranslations is safe here because this component is nested inside the
  // [locale]/layout which wraps children in <Providers> (NextIntlClientProvider).
  const t = useTranslations('errors');

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-4">
      <EmptyState
        variant="empty-error"
        title={t('somethingWentWrong')}
        description={t('pageNotFound')}
      />
      <Button intent="primary-blue" onClick={reset}>
        {t('tryAgain')}
      </Button>
    </main>
  );
}
