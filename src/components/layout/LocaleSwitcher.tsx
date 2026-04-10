'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';

const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

export default function LocaleSwitcher() {
  const t = useTranslations('navigation');
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">{t('language')}:</span>
      <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
        {LOCALES.map(({ code, label }) => {
          const isActive = currentLocale === code;

          return (
            <Link
              key={code}
              href={pathname}
              locale={code}
              style={isActive ? { color: '#ffffff' } : undefined}
              className={
                isActive
                  ? 'rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white'
                  : 'rounded-full px-3 py-1 text-sm text-slate-600 transition hover:bg-white hover:text-slate-900'
              }
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
