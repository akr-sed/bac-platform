'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  BookOpen,
  Check,
  ChevronDown,
  ImageIcon,
  Loader2,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  subjectBadgeClass,
  difficultyDotClass,
  sourceLabel,
} from '@/lib/exercise-badges';
import { cn } from '@/lib/utils';

export type TutorSource = 'bac' | 'bac_blanc' | 'community';

export interface TutorExerciseOption {
  _id: string;
  title: string;
  subject: string;
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  source: TutorSource;
  year: number | null;
  hasQuestionFigure: boolean;
}

interface Props {
  value: string | null;
  onSelect: (option: TutorExerciseOption) => void;
  /** Optional summary of the currently-selected exercise (for the compact preview inside the trigger). */
  selected: TutorExerciseOption | null;
  options: TutorExerciseOption[];
  loading: boolean;
}

type SourceFilter = 'all' | TutorSource;

/**
 * Tutor exercise picker — replaces the bare `<Select>` that was rendering
 * raw ObjectIds when its `<Select.Value />` couldn't resolve a label.
 *
 * Trigger renders our OWN compact preview (placeholder OR title + subject pill)
 * so the displayed text is always under our control. The full list lives in a
 * Dialog, which gives us:
 *  - focus trap + escape-to-close out of the box (base-ui Dialog).
 *  - native mobile UX (modal takeover) at no extra cost.
 *  - room for a search input + filter chips + scrollable rich rows.
 */
export function TutorExercisePicker({
  value,
  onSelect,
  selected,
  options,
  loading,
}: Props) {
  const t = useTranslations('tutor');
  const locale = useLocale();
  const loc = (locale === 'fr' || locale === 'en' ? locale : 'ar') as
    | 'ar'
    | 'fr'
    | 'en';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus search when the dialog opens. base-ui doesn't expose an
  // `onOpenAutoFocus` here so we hook the open state directly.
  useEffect(() => {
    if (!open) return;
    const tick = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(tick);
  }, [open]);

  const normalized = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((opt) => {
      if (source !== 'all' && opt.source !== source) return false;
      if (!q) return true;
      const hay = `${opt.title} ${opt.subject} ${opt.topic ?? ''} ${opt.year ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query, source]);

  const sourceChips: Array<{ key: SourceFilter; label: string }> = [
    { key: 'all', label: t('source.all') },
    { key: 'bac', label: t('source.bac') },
    { key: 'bac_blanc', label: t('source.bac_blanc') },
    { key: 'community', label: t('source.community') },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'group flex h-14 w-full items-center justify-between gap-3 rounded-2xl border-2 border-[#BBC8D4] bg-white px-4 text-start transition-colors',
          'hover:border-[#7ECCFE] focus:outline-none focus-visible:border-[#0095D1] focus-visible:ring-2 focus-visible:ring-[#0095D1]/30',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
              selected
                ? 'bg-[#0095D1] text-white'
                : 'bg-[#E6F4FA] text-[#0095D1]'
            )}
          >
            <BookOpen className="size-4" />
          </span>
          {loading ? (
            <span className="flex items-center gap-2 text-sm text-[#3E4850]">
              <Loader2 className="size-4 animate-spin" />
              {t('loadingExercises')}
            </span>
          ) : selected ? (
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-[#003449]">
                {selected.title}
              </span>
              <span className="truncate text-xs text-[#3E4850]">
                {sourceLabel(selected.source, selected.year, loc)}
              </span>
            </span>
          ) : (
            <span className="text-sm font-semibold text-[#3E4850]">
              {t('selectExercise')}
            </span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#6B7280] transition-transform group-aria-expanded:rotate-180" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="grid max-h-[85vh] w-full max-w-[calc(100%-1.5rem)] grid-rows-[auto_auto_auto_1fr] gap-3 rounded-2xl p-0 sm:max-h-[80vh] sm:max-w-xl"
          showCloseButton={false}
        >
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="text-base text-[#003449]">
              {t('pickerTitle')}
            </DialogTitle>
            <p className="text-xs text-[#3E4850]">{t('pickerSubtitle')}</p>
          </DialogHeader>

          {/* Search */}
          <div className="px-5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-[#6B7280] start-3"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-11 w-full rounded-xl border border-[#D9EFF8] bg-[#F9FBFD] ps-10 pe-3 text-sm text-[#003449] placeholder:text-[#6B7280] focus:border-[#0095D1] focus:outline-none focus:ring-2 focus:ring-[#0095D1]/20"
              />
            </div>
          </div>

          {/* Source filter chips */}
          <div className="flex gap-2 overflow-x-auto px-5 pb-1 sm:flex-wrap sm:overflow-visible">
            {sourceChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setSource(chip.key)}
                aria-pressed={source === chip.key}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  source === chip.key
                    ? 'bg-[#0095D1] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                    : 'bg-[#F0F4F9] text-[#3E4850] hover:bg-[#E6F4FA]'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="min-h-0 overflow-y-auto px-2 pb-5">
            {loading ? (
              <div className="flex h-32 items-center justify-center text-sm text-[#3E4850]">
                <Loader2 className="me-2 size-4 animate-spin" />
                {t('loadingExercises')}
              </div>
            ) : normalized.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-[#3E4850]">
                <p className="font-semibold text-[#003449]">{t('noMatches')}</p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {t('noMatchesHint')}
                </p>
              </div>
            ) : (
              <ul className="space-y-1" role="listbox">
                {normalized.map((opt) => {
                  const active = opt._id === value;
                  return (
                    <li key={opt._id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(opt);
                          setOpen(false);
                          setQuery('');
                        }}
                        role="option"
                        aria-selected={active}
                        className={cn(
                          'group flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-start transition-colors',
                          active
                            ? 'border-[#0095D1]/30 bg-[#E6F4FA]'
                            : 'hover:bg-[#F0F9FE]'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
                            active
                              ? 'bg-[#0095D1] text-white'
                              : 'bg-[#F0F4F9] text-transparent group-hover:bg-[#D9EFF8]'
                          )}
                          aria-hidden="true"
                        >
                          <Check className="size-3" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="line-clamp-1 text-sm font-semibold text-[#003449]">
                            {opt.title}
                          </span>
                          <span className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 font-bold capitalize',
                                subjectBadgeClass(opt.subject)
                              )}
                            >
                              {opt.subject}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F9FBFD] px-2 py-0.5 font-semibold text-[#3E4850] ring-1 ring-[#D9EFF8]">
                              {sourceLabel(opt.source, opt.year, loc)}
                            </span>
                            {opt.difficulty && (
                              <span className="inline-flex items-center gap-1 font-semibold text-[#3E4850]">
                                <span
                                  className={cn(
                                    'size-1.5 rounded-full',
                                    difficultyDotClass(opt.difficulty)
                                  )}
                                  aria-hidden="true"
                                />
                                {t(`difficulty.${opt.difficulty}`)}
                              </span>
                            )}
                            {opt.hasQuestionFigure && (
                              <span
                                className="inline-flex items-center gap-1 text-[#0095D1]"
                                title={t('hasFigureHint')}
                              >
                                <ImageIcon className="size-3" aria-hidden="true" />
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
