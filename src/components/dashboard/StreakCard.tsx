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

  // Split into two rows so the cells stay roomy even on narrow phones:
  // [day0, day1, day2] then [day3, day4, day5, day6]. Today (idx 6) lands in
  // the last slot of the second row — natural reading order in both LTR and
  // RTL (flex auto-mirrors).
  const firstRow = streakWeek.slice(0, 3);
  const secondRow = streakWeek.slice(3, 7);

  function renderCell(day: StreakDay, absoluteIdx: number) {
    const dayKey = DAY_KEYS[absoluteIdx % 7];
    const isToday = absoluteIdx === todayIdx;
    const isActive = day.ok;
    return (
      <div key={day.date} className="flex flex-col items-center gap-1.5">
        <span className="text-[11px] text-[#3E4850] font-arabic">
          {tWeekdays(dayKey)}
        </span>
        <div
          className={[
            'flex size-10 items-center justify-center rounded-full text-[12px]',
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
              <Check className="size-3 text-[#EA580C]" />
            )
          ) : (
            <span className="text-[#3E4850]">–</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col justify-between gap-5 overflow-hidden rounded-[12px] border border-[#DFE3E8] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-3xl font-bold text-[#EA580C] font-arabic leading-none sm:text-[32px]">
          {tStreak('days', { count: streakDays })}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-[#171C20] font-arabic">
            {tStreak('title')}
          </span>
          <Flame className="size-[18px] shrink-0 text-[#EA580C]" />
        </div>
      </div>

      {/* 7-day strip — split 3 + 4 so the cells stay roomy on any width */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-around gap-2">
          {firstRow.map((day, i) => renderCell(day, i))}
        </div>
        <div className="flex items-center justify-around gap-2">
          {secondRow.map((day, i) => renderCell(day, i + 3))}
        </div>
      </div>
    </div>
  );
}
