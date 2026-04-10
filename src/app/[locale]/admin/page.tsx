import { useTranslations } from 'next-intl';

export default function AdminPage() {
  const t = useTranslations('admin');

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t('title')}
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              {t('totalUsers')}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">0</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              {t('totalExercises')}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">0</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              {t('pendingReports')}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">0</p>
          </div>
        </div>
      </section>
    </main>
  );
}
