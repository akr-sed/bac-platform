'use client';

import { Bookmark } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface Badge {
  key: string;
  title: string;
  icon: string;
  rarity: string;
}

interface BadgesCardProps {
  badges: Badge[];
}

const RARITY_STYLES: Record<string, string> = {
  common: 'bg-[#EAEEF3] border-[#DFE3E8]',
  rare: 'bg-[#EFF6FF] border-[#BFDBFE]',
  epic: 'bg-[#FAF5FF] border-[#E9D5FF]',
  legendary: 'bg-[#FFFBEB] border-[#FDE68A]',
};

export function BadgesCard({ badges }: BadgesCardProps) {
  const t = useTranslations('profileDashboard.badges');

  const displayBadges = badges.slice(0, 6);

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden rounded-[12px] border border-[#DFE3E8] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/leaderboard" className="text-[14px] font-medium text-[#0095D1] hover:underline font-arabic">
          {t('viewAll')}
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-[#171C20] font-arabic">{t('title')}</span>
          <Bookmark className="size-4 shrink-0 text-[#0095D1]" />
        </div>
      </div>

      {/* Badge grid */}
      {displayBadges.length === 0 ? (
        <div className="py-4 text-center text-[12px] text-[#3E4850] font-arabic">
          —
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {displayBadges.map((badge) => (
            <div key={badge.key} className="flex flex-col items-center gap-2">
              <div
                className={`flex size-14 items-center justify-center rounded-full border-2 text-2xl shadow-[0_1px_1px_rgba(0,0,0,0.05)] ${
                  RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common
                }`}
                aria-label={badge.title}
              >
                {badge.icon}
              </div>
              <span className="text-center text-[12px] font-medium text-[#3E4850] font-arabic leading-tight">
                {badge.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
