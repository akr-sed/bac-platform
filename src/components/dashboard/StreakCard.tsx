'use client';

import { Flame, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StreakDay {
  date: string;
  ok: boolean;
}

interface StreakCardProps {
  streakDays: number;
  streakWeek: StreakDay[];
}

const DAY_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;

export function StreakCard({ streakDays, streakWeek }: StreakCardProps) {
  const t = useTranslations('profileDashboard');
  const tStreak = useTranslations('profileDashboard.streak');
  const tWeekdays = useTranslations('profileDashboard.weekdays');

  // The API returns last 7 days. Today = streakWeek[6].
  const todayIdx = 6;

  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-[#DFE3E8] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[32px] font-bold text-[#EA580C] font-arabic leading-none">
          {tStreak('days', { count: streakDays })}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#171C20] font-arabic">
            {tStreak('title')}
          </span>
          <Flame className="size-[16px] text-[#EA580C]" />
        </div>
      </div>

      {/* 7-day strip */}
      <div className="flex items-center justify-between">
        {streakWeek.map((day, idx) => {
          const dayKey = DAY_KEYS[idx % 7];
          const isToday = idx === todayIdx;
          const isActive = day.ok;

          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-[12px] text-[#3E4850] font-arabic">
                {tWeekdays(dayKey)}
              </span>
              <div
                className={[
                  'flex size-8 items-center justify-center rounded-full text-[12px]',
                  isToday && isActive
                    ? 'bg-[#F97316] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]'
                    : isActive
                    ? 'border border-[#FED7AA] bg-[#FFEDD5]'
                    : 'bg-[#E5E8EE] text-[#171C20]',
                ].join(' ')}
              >
                {isActive ? (
                  isToday ? (
                    <span className="text-[11px] font-semibold font-arabic">
                      {t('activityTab').charAt(0)}
                    </span>
                  ) : (
                    <Check className="size-2.5 text-[#EA580C]" />
                  )
                ) : (
                  <span className="text-[#3E4850]">–</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
