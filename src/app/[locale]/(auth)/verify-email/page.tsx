'use client';

// §6.4 Email verification page

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const t = useTranslations('verifyEmail');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 animate-spin text-[#0095D1]" />
        <p className="text-sm text-[#6D7D8B]">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-6">
        <EmptyState
          variant="success"
          title={t('successTitle')}
          description={t('successDescription')}
        />
        <div className="flex justify-center">
          <Link href="/login">
            <Button intent="primary-blue" size="desktop">
              {t('backToLogin')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmptyState
        variant="empty-error"
        title={t('errorTitle')}
        description={t('errorDescription')}
      />
      <div className="flex justify-center">
        <Link href="/login">
          <Button intent="primary-blue" size="desktop">
            {t('backToLogin')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const tFooter = useTranslations('footer');

  return (
    <main className="flex min-h-[calc(100dvh-4rem)]">
      {/* Left panel — brand accent */}
      <div className="hidden w-2/5 flex-col items-center justify-center gap-6 bg-[#E6F4FA] px-10 lg:flex">
        <Logo variant="vertical" size={160} priority />
        <p className="max-w-xs text-center text-sm font-medium text-[#6D7D8B]">
          {tFooter('slogan')}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-12 sm:px-10">
        <div className="mb-8 lg:hidden">
          <Logo variant="horizontal" size="lg" />
        </div>
        <div className="w-full max-w-sm">
          <Suspense
            fallback={
              <div className="flex justify-center">
                <Loader2 className="size-8 animate-spin text-[#0095D1]" />
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
