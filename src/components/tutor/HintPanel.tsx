'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MathTextInline } from '@/components/ui/math-text';
import { cn } from '@/lib/utils';

interface HintResponse {
  hint: string;
  level: number;
  exhausted: boolean;
  __placeholder?: boolean;
}

const LEVELS: Array<{ value: 1 | 2 | 3; key: 'level1' | 'level2' | 'level3' }> = [
  { value: 1, key: 'level1' },
  { value: 2, key: 'level2' },
  { value: 3, key: 'level3' },
];

interface Props {
  exerciseId: string;
}

export function HintPanel({ exerciseId }: Props) {
  const t = useTranslations('tutor');
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [hint, setHint] = useState<HintResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state whenever the exercise changes so stale hints don't bleed
  // across selections.
  useEffect(() => {
    setLevel(1);
    setHint(null);
    setError(null);
    setLoading(false);
  }, [exerciseId]);

  async function request() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tutor/hint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ exerciseId, level }),
      });
      if (!res.ok) {
        setError(t('errorGeneric'));
        return;
      }
      setHint((await res.json()) as HintResponse);
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Hint level — segmented control */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#3E4850]">
          {t('hintLevel')}
        </p>
        <div
          role="radiogroup"
          aria-label={t('hintLevel')}
          className="inline-flex w-full rounded-full bg-[#F0F4F9] p-1 sm:w-auto"
        >
          {LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              type="button"
              role="radio"
              aria-checked={level === lvl.value}
              onClick={() => setLevel(lvl.value)}
              className={cn(
                'flex-1 min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold transition-all sm:flex-none',
                level === lvl.value
                  ? 'bg-white text-[#003449] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                  : 'text-[#3E4850] hover:text-[#003449]'
              )}
            >
              {t(lvl.key)}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        intent="primary-blue"
        size="sm"
        onClick={request}
        loading={loading}
        disabled={loading}
      >
        {loading ? t('thinking') : t('getHint')}
      </Button>

      {error && (
        <p className="text-sm text-[#ED2D30]" role="alert">
          {error}
        </p>
      )}

      {loading && !hint && (
        <div className="space-y-3 rounded-2xl border border-[#D9EFF8] bg-white p-5 shadow-sm">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-5/6 rounded-full" />
          <Skeleton className="h-4 w-4/6 rounded-full" />
        </div>
      )}

      {hint && (
        <div className="rounded-2xl border border-[#D9EFF8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4FA] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#00709D]">
              <Lightbulb className="size-3.5" />
              {t(`level${hint.level}` as 'level1' | 'level2' | 'level3')}
            </span>
            {hint.__placeholder && (
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#0095D1]/40 bg-[#E6F4FA] px-2 py-0.5 text-[11px] font-semibold text-[#00709D]">
                <Sparkles className="size-3" />
                {t('placeholderBadge')}
              </span>
            )}
          </div>
          <MathTextInline className="block text-base leading-7 text-[#003449]">
            {hint.hint}
          </MathTextInline>
          {hint.exhausted && (
            <p className="mt-3 text-sm text-[#3E4850]">{t('exhaustedHints')}</p>
          )}
        </div>
      )}
    </div>
  );
}
