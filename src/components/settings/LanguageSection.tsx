'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LOCALES: Array<{ code: Locale; label: string; nativeName: string }> = [
  { code: 'ar', label: 'AR', nativeName: 'العربية' },
  { code: 'fr', label: 'FR', nativeName: 'Français' },
  { code: 'en', label: 'EN', nativeName: 'English' },
];

export function LanguageSection() {
  const t = useTranslations('settings.languageSection');
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#003449]">{t('title')}</h2>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#25313C]">{t('language')}</p>
        <div className="flex flex-wrap gap-3">
          {LOCALES.map(({ code, label, nativeName }) => {
            const isActive = currentLocale === code;
            return (
              <Link
                key={code}
                href={pathname}
                locale={code}
                className={cn(
                  'cursor-pointer rounded-2xl border-2 px-5 py-3 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'border-[#0095D1] bg-[#E6F4FA] text-[#0095D1]'
                    : 'border-[#BBC8D4] bg-white text-[#25313C] hover:border-[#0095D1]'
                )}
              >
                <span className="font-bold">{label}</span>
                <span className="ms-2 font-normal text-[#6D7D8B]">{nativeName}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
