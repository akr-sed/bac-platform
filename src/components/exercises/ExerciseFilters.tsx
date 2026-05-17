'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExerciseFiltersProps {
  search?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
}

export default function ExerciseFilters({
  search = '',
  subject = '',
  topic = '',
  difficulty = '',
}: ExerciseFiltersProps) {
  const t = useTranslations('exercises.filter');
  const tDiff = useTranslations('exercises.difficulty');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (subject) params.set('subject', subject);
      if (topic) params.set('topic', topic);
      if (difficulty) params.set('difficulty', difficulty);

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [search, subject, topic, difficulty, router, pathname]
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-auto sm:flex-1">
        <Input
          placeholder={tCommon('search')}
          defaultValue={search}
          onChange={(e) => {
            const value = (e.target as HTMLInputElement).value;
            updateParams('search', value);
          }}
        />
      </div>
      <div className="w-full sm:w-40">
        <Input
          placeholder={t('subject')}
          defaultValue={subject}
          onChange={(e) => {
            const value = (e.target as HTMLInputElement).value;
            updateParams('subject', value);
          }}
        />
      </div>
      <div className="w-full sm:w-40">
        <Input
          placeholder={t('topic')}
          defaultValue={topic}
          onChange={(e) => {
            const value = (e.target as HTMLInputElement).value;
            updateParams('topic', value);
          }}
        />
      </div>
      <div className="w-full sm:w-40">
        <Select
          value={difficulty || 'all'}
          onValueChange={(value) =>
            updateParams('difficulty', value === 'all' ? '' : (value ?? ''))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="easy">{tDiff('easy')}</SelectItem>
            <SelectItem value="medium">{tDiff('medium')}</SelectItem>
            <SelectItem value="hard">{tDiff('hard')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
