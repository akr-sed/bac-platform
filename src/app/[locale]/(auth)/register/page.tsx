import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function RegisterPage() {
  const t = useTranslations('auth.register');

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t('title')}
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            {t('name')}
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            {t('email')}
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            {t('password')}
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            {t('confirmPassword')}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            {t('submit')}
          </button>
          <Link href="/login" className="text-sm font-medium text-slate-600 underline">
            {t('loginLink')}
          </Link>
        </div>
      </section>
    </main>
  );
}
