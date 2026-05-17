'use client';

import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface XPLevelCardProps {
  xp: number;
  level: number;
  levelProgress: { current: number; toNext: number; pct: number };
  nationalRank: number;
}

export function XPLevelCard({ xp, level, levelProgress, nationalRank }: XPLevelCardProps) {
  const t = useTranslations('profileDashboard.xpLevel');

  const nextLevel = level + 1;
  const remaining = levelProgress.toNext - levelProgress.current;
  const pct = Math.min(100, levelProgress.pct);

  return (
    <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#DFE3E8] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="rounded-[4px] bg-[#B0DEF1] px-2 py-1 text-[12px] font-bold text-[#004C6D] font-arabic">
          {t('title').includes('المستوى') ? `المستوى ${level}` : `Level ${level}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#171C20] font-arabic">{t('title')}</span>
          <Trophy className="size-5 text-[#0095D1]" />
        </div>
      </div>

      {/* XP amount + label */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-[#3E4850] font-arabic">{t('totalXp')}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-semibold text-[#171C20] font-arabic tabular-nums">
              {xp.toLocaleString()}
            </span>
            <span className="text-[14px] text-[#3E4850]">XP</span>
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
      <div className="flex items-center justify-between rounded-[8px] bg-[#0095D1] px-4 py-4">
        <Trophy className="size-[30px] text-white/80" />
        <div className="flex flex-col items-end">
          <span className="text-[14px] text-[#E6F4FA] font-arabic">{t('nationalRank')}</span>
          <span className="text-[24px] font-semibold text-[#E6F4FA] font-arabic leading-tight">
            #{nationalRank > 0 ? nationalRank : '–'}
          </span>
        </div>
      </div>
    </div>
  );
}
