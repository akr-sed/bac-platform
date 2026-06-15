'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { FILIERE_KEYS } from '@/lib/filiere';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  filiere?: string;
}

/**
 * Single filter dropdown for the /library page — surfaces the BAC stream
 * (filière) so students can narrow exam-import exercises to their own track.
 * Keeps state in the URL so server-rendered list re-fetches on change.
 */
export function LibraryFilterBar({ filiere = '' }: Props) {
  const t = useTranslations('library.filter');
  const tF = useTranslations('library.filiere');
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams();
      if (value && value !== 'all') params.set('filiere', value);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname]
  );

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-64">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t('filiere')}
        </label>
        <Select value={filiere || 'all'} onValueChange={update}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            {FILIERE_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {tF(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default LibraryFilterBar;
