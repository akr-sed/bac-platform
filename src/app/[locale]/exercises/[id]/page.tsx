import { useTranslations } from 'next-intl';

export default function ExerciseDetailPage() {
  const t = useTranslations('exercises.detail');

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t('solutions')}
        </h1>
        <p className="mt-3 text-slate-600">{t('noSolutions')}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              {t('postedBy')}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              {t('postedAt')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
