import { Trophy } from 'lucide-react';

interface Achievement {
  key: string;
  title: string;
  icon: string;
  rarity: string;
  unlockedAt: string;
}

interface AchievementsCardProps {
  earned: Achievement[];
  totalCount: number;
  locale: string;
}

export function AchievementsCard({ earned, totalCount, locale }: AchievementsCardProps) {
  const isAr = locale === 'ar';
  const earnedCount = earned.length;
  const progressPct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Show the most recently earned achievement, or a placeholder
  const top = earned[0];

  const rarityColors: Record<string, string> = {
    common: 'bg-[#EAEEF3] text-[#3E4850]',
    rare: 'bg-[#EFF6FF] text-[#1D4ED8]',
    epic: 'bg-[#FAF5FF] text-[#7C3AED]',
    legendary: 'bg-[#FFFBEB] text-[#D97706]',
  };

  const label = isAr ? 'الإنجازات' : 'Achievements';
  const placeholderName = isAr ? 'التمرين الأول' : 'First exercise';
  const missionLabel = isAr
    ? `3/4 مهمات للترقية القادمة`
    : `${earnedCount}/${totalCount} to next rank`;

  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-[#D9EFF8] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Trophy className="size-[18px] text-[#0095D1]" />
        <span className="text-[18px] font-bold text-[#171C20] font-arabic">{label}</span>
      </div>

      {/* Top achievement */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold text-[#171C20] font-arabic">
            {top?.title ? top.title : placeholderName}
          </span>
          <span className="text-[10px] text-[#3E4850] font-arabic">
            {top?.rarity ?? (isAr ? 'شائع' : 'common')}
          </span>
        </div>
        {/* Icon tile */}
        <div
          className={`flex size-[48px] shrink-0 items-center justify-center rounded-[8px] text-xl ${rarityColors[top?.rarity ?? 'common'] ?? 'bg-[#EAEEF3]'}`}
          aria-hidden
        >
          {top?.icon ?? '🏆'}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0F4F9]">
          <div
            className="h-full rounded-full bg-[#0095D1] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-center text-[12px] font-bold text-[#3E4850] font-arabic">
          {missionLabel}
        </p>
      </div>
    </div>
  );
}
