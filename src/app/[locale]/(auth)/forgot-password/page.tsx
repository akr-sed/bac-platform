'use client';

// §6.2 Forgot password page

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tFooter = useTranslations('footer');
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });

      if (res.ok) {
        setSent(true);
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
      <div className="flex flex-1 flex-col items-center justify-start bg-white px-4 py-8 sm:px-10 sm:py-12 lg:justify-center">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo variant="horizontal" size={56} />
        </div>

        <div className="w-full max-w-sm space-y-6 sm:space-y-8">
          {sent ? (
            <div className="space-y-6">
              <EmptyState
                variant="success"
                title={t('success')}
                description="We've sent a reset link to your email. Check your inbox."
              />
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t('backToLogin')}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#003449] sm:text-3xl">
                  {t('title')}
                </h1>
                <p className="text-sm text-[#6D7D8B]">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
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
                  <Label htmlFor="email">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      placeholder="you@example.com"
                      className="h-11 rounded-2xl ps-10"
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
                <Link
                  href="/login"
                  className="font-medium text-foreground hover:text-primary"
                >
                  {t('backToLogin')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
