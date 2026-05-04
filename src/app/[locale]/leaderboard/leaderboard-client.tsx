'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

// ── Period tab ─────────────────────────────────────────────────────────────
type Period = 'week' | 'month' | 'all';
type Stream = 'all' | 'sciences' | 'math' | 'lettres' | 'tech-math' | 'languages';

// ── Podium medal colors ────────────────────────────────────────────────────
const MEDAL: Record<number, { ring: string; label: string; bgGradient: string }> = {
  1: {
    ring: 'ring-2 ring-[#D4A017]',
    label: '🥇',
    bgGradient: 'from-[#FFF3CD] to-[#FFF8E7]',
  },
  2: {
    ring: 'ring-2 ring-[#9E9E9E]',
    label: '🥈',
    bgGradient: 'from-[#F5F5F5] to-[#FAFAFA]',
  },
  3: {
    ring: 'ring-2 ring-[#CD7F32]',
    label: '🥉',
    bgGradient: 'from-[#FFF0E5] to-[#FFF8F3]',
  },
};

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const t = useTranslations('leaderboard');
  const medal = MEDAL[entry.rank];
  if (!medal) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-[20px] border border-[#BBC8D4] p-5',
        'bg-gradient-to-b',
        medal.bgGradient,
        entry.rank === 1 && 'order-first lg:order-none scale-105'
      )}
    >
      <span className="text-2xl">{medal.label}</span>
      <UserAvatar
        src={entry.user.avatarUrl}
        name={entry.user.name}
        px={48}
        className={medal.ring}
      />
      <p className="max-w-[100px] truncate text-center text-sm font-extrabold text-[#003449]">
        {entry.user.name}
      </p>
      <p className="text-lg font-extrabold text-[#0095D1]">
        {entry.points}{' '}
        <span className="text-xs font-semibold text-[#6D7D8B]">{t('points')}</span>
      </p>
    </div>
  );
}

function RankedRow({ entry }: { entry: LeaderboardEntry }) {
  const t = useTranslations('leaderboard');

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#BBC8D4] bg-white px-4 py-3">
      <span className="w-7 shrink-0 text-center text-sm font-extrabold text-[#6D7D8B]">
        #{entry.rank}
      </span>
      <UserAvatar src={entry.user.avatarUrl} name={entry.user.name} size="sm" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#25313C]">
        {entry.user.name}
      </p>
      <p className="shrink-0 text-sm font-extrabold text-[#0095D1]">
        {entry.points}{' '}
        <span className="text-xs font-normal text-[#6D7D8B]">{t('points')}</span>
      </p>
    </div>
  );
}

export function LeaderboardClient() {
  const t = useTranslations('leaderboard');
  const [period, setPeriod] = useState<Period>('week');
  const [stream, setStream] = useState<Stream>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&stream=${stream}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period, stream]);

  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: t('tabs.week') },
    { key: 'month', label: t('tabs.month') },
    { key: 'all', label: t('tabs.all') },
  ];

  const streams: { key: Stream; label: string }[] = [
    { key: 'all', label: t('streams.all') },
    { key: 'sciences', label: t('streams.sciences') },
    { key: 'math', label: t('streams.math') },
    { key: 'lettres', label: t('streams.lettres') },
    { key: 'tech-math', label: t('streams.tech-math') },
    { key: 'languages', label: t('streams.languages') },
  ];

  const podium = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <div>
      {/* Period tabs */}
      <div className="mb-4 flex gap-1 rounded-[12px] bg-[#F0F4F8] p-1 w-fit">
        {periods.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'cursor-pointer rounded-[10px] px-4 py-1.5 text-sm font-semibold transition-colors',
              period === key
                ? 'bg-white text-[#0095D1] shadow-sm'
                : 'text-[#6D7D8B] hover:text-[#25313C]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stream dropdown */}
      <div className="mb-6">
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value as Stream)}
          className={cn(
            'cursor-pointer rounded-[12px] border border-[#BBC8D4] bg-white',
            'px-3 py-2 text-sm font-semibold text-[#25313C]',
            'focus:outline-none focus:ring-2 focus:ring-[#0095D1]'
          )}
        >
          {streams.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-[16px] bg-[#F0F4F8] animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          variant="empty-feed"
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              {/* Order: 2nd (silver) | 1st (gold) | 3rd (bronze) on desktop */}
              {[
                podium.find((e) => e.rank === 2),
                podium.find((e) => e.rank === 1),
                podium.find((e) => e.rank === 3),
              ]
                .filter(Boolean)
                .map((entry) => (
                  <PodiumCard key={entry!.user.id} entry={entry!} />
                ))}
            </div>
          )}

          {/* Ranked list */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((entry) => (
                <RankedRow key={entry.user.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
