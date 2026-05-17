import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { SessionForm } from '@/components/sessions/session-form';
import { getSession } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default async function NewSessionPage() {
  const t = await getTranslations('sessions');
  const auth = await getSession();
  const canCreate = auth?.role === 'teacher' || auth?.role === 'admin';

  if (!canCreate) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <h1 className="font-heading text-xl font-semibold">
            {t('teacherOnly')}
          </h1>
          <Link
            href="/sessions"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
          >
            {t('backToSessions')}
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">
        {t('newSession')}
      </h1>
      <SessionForm />
    </main>
  );
}
