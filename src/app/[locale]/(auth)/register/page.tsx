'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { GraduationCap, Mail, Lock, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg rounded-xl border border-border p-0 shadow-sm">
        <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-8">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="size-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h1>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
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
                  placeholder={t('name')}
                  className="ps-10"
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
                  className="ps-10"
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
                    className="ps-10"
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
                    className="ps-10"
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

            <Button type="submit" className="w-full cursor-pointer rounded-xl" disabled={loading}>
              {loading && <Loader2 className="me-2 size-4 animate-spin" />}
              {t('submit')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link href="/login" className="cursor-pointer font-medium text-primary hover:underline">
              {t('loginLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
