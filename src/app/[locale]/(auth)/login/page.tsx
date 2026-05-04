'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tFooter = useTranslations('footer');
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/');
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

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-12 sm:px-10">
        {/* Mobile logo (hidden on lg) */}
        <div className="mb-8 lg:hidden">
          <Logo variant="horizontal" size="lg" />
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#003449]">
              {t('title')}
            </h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password')}</Label>
                <button type="button" className="cursor-pointer text-xs font-medium text-primary hover:underline">
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="h-11 rounded-2xl ps-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="group h-11 w-full cursor-pointer gap-2 rounded-2xl text-base font-medium active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {t('submit')}
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="cursor-pointer font-medium text-foreground hover:text-primary">
              {t('registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
