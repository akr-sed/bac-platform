'use client';

// §6.3 Reset password page

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { EmptyState } from '@/components/ui/EmptyState';

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const tFooter = useTranslations('footer');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');

  if (!token) {
    return (
      <div className="space-y-6">
        <EmptyState
          variant="empty-error"
          title={t('invalidToken')}
          description="Please use the link from your email."
          action={{ label: 'Back to Login', href: '/login' }}
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (passwordValue !== confirmValue) {
      setError('Passwords do not match');
      return;
    }
    if (passwordValue.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: passwordValue }),
      });

      if (res.ok) {
        router.push('/login?reset=ok');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Server error');
      }
    } catch {
      setError('Server error, please try again');
    } finally {
      setLoading(false);
    }
  }

  // Strength hint
  const hasMinLength = passwordValue.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(passwordValue);
  const hasDigits = /\d/.test(passwordValue);
  const strengthOk = hasMinLength && hasLetters && hasDigits;

  return (
    <>
      {/* Left panel */}
      <div className="hidden w-2/5 flex-col items-center justify-center gap-6 bg-[#E6F4FA] px-10 lg:flex">
        <Logo variant="vertical" size={160} priority />
        <p className="max-w-xs text-center text-sm font-medium text-[#6D7D8B]">
          {tFooter('slogan')}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-start bg-white px-4 py-8 sm:px-10 sm:py-12 lg:justify-center">
        <div className="mb-8 lg:hidden">
          <Logo variant="horizontal" size={56} />
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#003449] sm:text-3xl">
              {t('title')}
            </h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  placeholder="••••••••"
                  className="h-11 rounded-2xl ps-10"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                />
              </div>
              {passwordValue.length > 0 && (
                <p className={`text-sm ${strengthOk ? 'text-green-600' : 'text-[#6D7D8B]'}`}>
                  8+ chars, mix of letters and digits
                  {strengthOk && ' ✓'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="h-11 rounded-2xl ps-10"
                  value={confirmValue}
                  onChange={(e) => setConfirmValue(e.target.value)}
                  aria-invalid={confirmValue.length > 0 && confirmValue !== passwordValue ? true : undefined}
                />
              </div>
            </div>

            <Button
              type="submit"
              intent="primary-blue"
              className="h-11 w-full rounded-2xl text-base font-medium"
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : t('submit')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-foreground hover:text-primary">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[calc(100dvh-4rem)]">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#0095D1]" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
