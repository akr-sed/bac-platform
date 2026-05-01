import { getTranslations } from 'next-intl/server';
import { ExamImportForm } from '@/components/admin/exam-import-form';

export default async function AdminImportExamPage() {
  const t = await getTranslations('admin.importExam');

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
