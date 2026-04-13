'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const t = useTranslations('auth.login');
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
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md rounded-xl border border-border p-0 shadow-sm">
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
                  placeholder={t('password')}
                  className="ps-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full cursor-pointer rounded-xl" disabled={loading}>
              {loading && <Loader2 className="me-2 size-4 animate-spin" />}
              {t('submit')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="cursor-pointer font-medium text-primary hover:underline">
              {t('registerLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
