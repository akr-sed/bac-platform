'use client';

import { ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { MathTextInline } from '@/components/ui/math-text';
import {
  subjectBadgeClass,
  difficultyDotClass,
  sourceLabel,
} from '@/lib/exercise-badges';
import { cn } from '@/lib/utils';

export interface TutorExerciseSummary {
  _id: string;
  title: string;
  subject: string;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  source: 'bac' | 'bac_blanc' | 'community';
  year?: number | null;
  topic?: string | null;
  /**
   * Optional 1-2 line preview of the question statement. The tutor index
   * endpoint doesn't return this by default — pass it through from the
   * client cache if you want a richer preview.
   */
  statementPreview?: string | null;
}

interface Props {
  exercise: TutorExerciseSummary;
  onChange: () => void;
}

/**
 * Compact preview of the currently-selected exercise. Replaces the bare
 * Select trigger value, so the picker never ends up showing a raw `_id`.
 */
export function SelectedExerciseCard({ exercise, onChange }: Props) {
  const t = useTranslations('tutor');
  const locale = useLocale();
  const loc = (locale === 'fr' || locale === 'en' ? locale : 'ar') as
    | 'ar'
    | 'fr'
    | 'en';

  return (
    <div className="rounded-xl border border-[#D9EFF8] bg-[#F0F9FE] p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <Link
              href={`/exercises/${exercise._id}` as '/'}
              className="group flex min-w-0 items-center gap-1.5 text-start font-semibold text-[#003449] transition-colors hover:text-[#0095D1]"
            >
              <span className="truncate">{exercise.title}</span>
              <ArrowUpRight
                className="size-3.5 shrink-0 text-[#0095D1] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize',
                subjectBadgeClass(exercise.subject)
              )}
            >
              {exercise.subject}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#3E4850] ring-1 ring-[#D9EFF8]">
              {sourceLabel(exercise.source, exercise.year ?? null, loc)}
            </span>
            {exercise.difficulty && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3E4850]">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    difficultyDotClass(exercise.difficulty)
                  )}
                  aria-hidden="true"
                />
                {t(`difficulty.${exercise.difficulty}`)}
              </span>
            )}
          </div>

          {exercise.statementPreview && (
            <MathTextInline className="line-clamp-2 text-sm leading-relaxed text-[#3E4850]">
              {exercise.statementPreview}
            </MathTextInline>
          )}
        </div>

        <button
          type="button"
          onClick={onChange}
          className="shrink-0 min-h-11 px-2 py-1 text-xs font-semibold text-[#0095D1] underline-offset-2 transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0095D1] focus-visible:ring-offset-2"
        >
          {t('change')}
        </button>
      </div>
    </div>
  );
}
