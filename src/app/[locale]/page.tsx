import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('common');
  const nav = useTranslations('navigation');

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950">
          {t('welcome')}
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/exercises"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {nav('exercises')}
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
          >
            {nav('register')}
          </Link>
        </div>
      </section>
    </main>
  );
}
