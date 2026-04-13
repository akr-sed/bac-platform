'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
];

export default function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
      {LOCALES.map(({ code, label }) => {
        const isActive = currentLocale === code;

        return (
          <Link
            key={code}
            href={pathname}
            locale={code}
            className={cn(
              'cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
