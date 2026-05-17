'use client';

import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface XPLevelCardProps {
  xp: number;
  level: number;
  /**
   * Progress object. The API returns `{ current, nextThreshold, pct }` while
   * older callers passed `{ current, toNext, pct }`. We accept both shapes so
   * the UI doesn't render NaN when a field is renamed upstream.
   */
  levelProgress: {
    current?: number;
    toNext?: number;
    nextThreshold?: number;
    pct?: number;
  };
  nationalRank: number;
}

// Coerce any value that should be a finite number; fall back to the provided
// placeholder. Centralizes the NaN/undefined defense across all stats here.
function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function XPLevelCard({ xp, level, levelProgress, nationalRank }: XPLevelCardProps) {
  const t = useTranslations('profileDashboard.xpLevel');

  // Defensive coercion — every numeric input gets a sane placeholder so the UI
  // never shows "NaN". Real data flows through unchanged.
  const safeXp = finiteOr(xp, 0);
  const safeLevel = finiteOr(level, 1);
  const safeCurrent = finiteOr(levelProgress?.current, 0);
  const safeToNext = finiteOr(
    levelProgress?.toNext ?? levelProgress?.nextThreshold,
    100
  );
  const safePct = finiteOr(levelProgress?.pct, 0);
  const safeRank = finiteOr(nationalRank, 0);

  const nextLevel = safeLevel + 1;
  const remaining = Math.max(0, safeToNext - safeCurrent);
  const pct = Math.min(100, Math.max(0, safePct));

  return (
    <div className="flex h-full min-w-0 flex-col justify-between gap-4 overflow-hidden rounded-[12px] border border-[#DFE3E8] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-[4px] bg-[#B0DEF1] px-2 py-1 text-[12px] font-bold text-[#004C6D] font-arabic">
          {t('title').includes('المستوى') ? `المستوى ${safeLevel}` : `Level ${safeLevel}`}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-[#171C20] font-arabic">{t('title')}</span>
          <Trophy className="size-5 shrink-0 text-[#0095D1]" />
        </div>
      </div>

      {/* XP amount + label */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[14px] text-[#3E4850] font-arabic">{t('totalXp')}</span>
          <div className="flex min-w-0 items-baseline gap-1">
            <span className="truncate text-[20px] font-semibold text-[#171C20] font-arabic tabular-nums sm:text-[24px]">
              {safeXp.toLocaleString()}
            </span>
            <span className="shrink-0 text-[14px] text-[#3E4850]">XP</span>
          </div>
        </div>

        {/* Progress bar — orange/yellow gradient */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#E5E8EE]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(to left, #FFD700, #F97316)',
            }}
          />
        </div>

        <p className="text-end text-[14px] text-[#3E4850] font-arabic">
          {t('nextLevel', { remaining, next: nextLevel })}
        </p>
      </div>

      {/* National rank strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-[#0095D1] px-4 py-4">
        <Trophy className="size-[30px] shrink-0 text-white/80" />
        <div className="flex min-w-0 flex-col items-end">
          <span className="truncate text-[14px] text-[#E6F4FA] font-arabic">{t('nationalRank')}</span>
          <span className="text-[20px] font-semibold text-[#E6F4FA] font-arabic leading-tight tabular-nums sm:text-[24px]">
            #{safeRank > 0 ? safeRank.toLocaleString() : '–'}
          </span>
        </div>
      </div>
    </div>
  );
}
