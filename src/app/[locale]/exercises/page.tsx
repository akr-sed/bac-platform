import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function ExercisesPage() {
  const t = useTranslations('exercises');

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t('browse')}
        </h1>
        <p className="mt-3 text-slate-600">{t('noResults')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
            {t('filter.subject')}
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
            {t('filter.topic')}
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
            {t('filter.difficulty')}
          </span>
        </div>
        <Link
          href="/exercises/demo"
          className="mt-8 inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
        >
          {t('detail.solutions')}
        </Link>
      </section>
    </main>
  );
}
