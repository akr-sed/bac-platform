import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  const t = useTranslations('navigation');

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-950">
            BAC Platform
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <Link href="/" className="transition hover:text-slate-950">
              {t('home')}
            </Link>
            <Link href="/exercises" className="transition hover:text-slate-950">
              {t('exercises')}
            </Link>
            <Link href="/admin" className="transition hover:text-slate-950">
              {t('admin')}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/profile" className="text-sm text-slate-600 transition hover:text-slate-950">
            {t('profile')}
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('register')}
          </Link>
          <LocaleSwitcher />
        </div>
      </nav>
    </header>
  );
}
