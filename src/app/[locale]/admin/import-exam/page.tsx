import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { ExamImportForm } from '@/components/admin/exam-import-form';
import { getSession } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default async function AdminImportExamPage() {
  const t = await getTranslations('admin.importExam');
  const auth = await getSession();
  // The API at /api/exams/import already enforces role server-side, but
  // surfacing the form to logged-out users / students is poor UX — they
  // would fill it in only to get a 403 on submit. Mirror /sessions/new and
  // render a friendly redirect card instead.
  const canImport = auth?.role === 'teacher' || auth?.role === 'admin';

  if (!canImport) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <h1 className="font-heading text-xl font-semibold">
            {t('teacherOnly')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('teacherOnlyHint')}
          </p>
          <Link
            href={auth ? '/dashboard' : '/login'}
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
          >
            {t('teacherOnlyAction')}
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <ExamImportForm />
    </main>
  );
}
