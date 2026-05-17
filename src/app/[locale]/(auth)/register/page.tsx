'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { Mail, Lock, UserCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/components/providers/AuthProvider';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const tErr = useTranslations('auth.errors');
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    const confirmPassword = form.get('confirmPassword') as string;
    const role = (form.get('role') as 'student' | 'teacher') || 'student';

    if (password !== confirmPassword) {
      setError(tErr('passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(tErr('weakPassword'));
      return;
    }

    setLoading(true);
    const result = await register(name, email, password, role);

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
          {t('title')}
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo variant="horizontal" size="lg" />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#003449]">
              {t('title')}
            </h1>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <div className="relative">
                <UserCircle className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  placeholder={t('name')}
                  className="h-11 rounded-2xl ps-10"
                />
              </div>
            </div>

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
                  placeholder={t('email')}
                  className="h-11 rounded-2xl ps-10"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder={t('password')}
                    className="h-11 rounded-2xl ps-10"
                  />
                </div>
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
                    placeholder={t('confirmPassword')}
                    className="h-11 rounded-2xl ps-10"
                  />
                </div>
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label>{t('role')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-all duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    defaultChecked
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">{t('student')}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-all duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">{t('teacher')}</span>
                </label>
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
            {t('hasAccount')}{' '}
            <Link href="/login" className="cursor-pointer font-medium text-foreground hover:text-primary">
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
