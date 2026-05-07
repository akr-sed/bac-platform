'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export function HtmlLocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    const root = document.documentElement;
    if (root.lang !== locale) root.lang = locale;
    if (root.dir !== dir) root.dir = dir;
  }, [locale]);

  return null;
}
