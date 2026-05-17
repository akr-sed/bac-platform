'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { BadgesCard } from '@/components/dashboard/BadgesCard';
import { XPLevelCard } from '@/components/dashboard/XPLevelCard';
import { ProfileIdentityCard } from '@/components/dashboard/ProfileIdentityCard';
import { SubjectProgressSection } from '@/components/dashboard/SubjectProgressSection';
import { ActivityTabs } from '@/components/dashboard/ActivityTabs';
import { useAuth } from '@/components/providers/AuthProvider';
import type { ActivityEntryDTO } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryData {
  user: {
    xp: number;
    level: number;
    levelProgress: { current: number; toNext: number; pct: number };
    streakDays: number;
    streakWeek: { date: string; ok: boolean }[];
    nationalRank: number;
  };
  badges: {
    earned: { key: string; title: string; icon: string; rarity: string; unlockedAt: string }[];
    lockedCount: number;
  };
}

interface SubjectProgressData {
  subjects: { subject: string; completed: number; total: number; pct: number }[];
}

interface ActivityData {
  activity: ActivityEntryDTO[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const t = useTranslations('profileDashboard');
  const { user } = useAuth();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgressData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const noStore: RequestInit = { cache: 'no-store' };
    Promise.all([
      fetch('/api/gamification/summary', noStore).then((r) => r.ok ? r.json() : null),
      fetch('/api/gamification/subject-progress', noStore).then((r) => r.ok ? r.json() : null),
      fetch('/api/gamification/activity', noStore).then((r) => r.ok ? r.json() : null),
    ])
      .then(([sum, subj, act]) => {
        setSummary(sum);
        setSubjectProgress(subj);
        setActivityData(act);
      })
      .catch(() => {/* silent — show placeholders */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#0095D1]" />
        </div>
      </AppShell>
    );
  }

  const streakDays = summary?.user.streakDays ?? 0;
  const streakWeek = summary?.user.streakWeek ?? Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
    ok: false,
  }));
  const badges = summary?.badges.earned ?? [];
  const xp = summary?.user.xp ?? 0;
  const level = summary?.user.level ?? 1;
  const levelProgress = summary?.user.levelProgress ?? { current: 0, toNext: 100, pct: 0 };
  const nationalRank = summary?.user.nationalRank ?? 0;
  const subjects = subjectProgress?.subjects ?? [];
  const activity = activityData?.activity ?? [];

  // User stream / class from preferences (not in summary — use auth context)
  const userName = user?.name ?? '';
  const userAvatar = user?.avatar ?? null;

  return (
    <AppShell>
      <div className="py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-[24px] sm:text-[32px] font-bold text-[#171C20] font-arabic">{t('title')}</h1>
          <p className="mt-1 text-[14px] text-[#3E4850] font-arabic">{t('subtitle')}</p>
        </div>

        {/* Top header strip — 4-card grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StreakCard streakDays={streakDays} streakWeek={streakWeek} />
          <BadgesCard badges={badges} />
          <XPLevelCard
            xp={xp}
            level={level}
            levelProgress={levelProgress}
            nationalRank={nationalRank}
          />
          <div className="order-first sm:order-none">
            <ProfileIdentityCard
              name={userName}
              avatar={userAvatar}
            />
          </div>
        </div>

        {/* Subject progress */}
        <div className="mb-6">
          <SubjectProgressSection subjects={subjects} />
        </div>

        {/* Activity tabs */}
        <ActivityTabs activity={activity} />
      </div>
    </AppShell>
  );
}
