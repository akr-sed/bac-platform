import { connectToDatabase } from '@/lib/mongodb';
import { xpToNextLevel } from '@/lib/gamification';
import User from '@/models/User';
import Achievement from '@/models/Achievement';
import UserAchievement from '@/models/UserAchievement';
import DailyQuest from '@/models/DailyQuest';
import UserQuestProgress from '@/models/UserQuestProgress';
import Session from '@/models/Session';
import mongoose from 'mongoose';
import { AchievementsCard } from './AchievementsCard';
import { DailyQuestsCard } from './DailyQuestsCard';
import { UpcomingSessionsCard } from './UpcomingSessionsCard';

// Re-export helper — same shape as /api/gamification/summary but called directly
async function loadGamificationSummary(userId: string) {
  await connectToDatabase();

  const userObjId = new mongoose.Types.ObjectId(userId);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [allAchievements, earnedAchievements, activeQuests, questProgress, upcomingSessions] =
    await Promise.all([
      Achievement.find({}).lean(),
      UserAchievement.find({ user: userObjId, unlockedAt: { $exists: true } })
        .populate<{
          achievement: {
            key: string;
            titleKey: string;
            icon: string;
            rarity: string;
          };
        }>('achievement')
        .sort({ unlockedAt: -1 })
        .lean(),
      DailyQuest.find({ active: true }).lean(),
      UserQuestProgress.find({ user: userObjId, date: todayStr }).lean(),
      Session.find({
        status: { $in: ['scheduled', 'live'] },
        scheduledAt: { $gte: today },
      })
        .sort({ scheduledAt: 1 })
        .limit(3)
        .select('title subject scheduledAt')
        .lean(),
    ]);

  const earnedBadges = earnedAchievements
    .filter((ea) => ea.achievement)
    .map((ea) => {
      const ach = ea.achievement as unknown as {
        key: string;
        titleKey: string;
        icon: string;
        rarity: string;
      };
      return {
        key: ach.key,
        title: ach.titleKey,
        icon: ach.icon ?? '🏆',
        rarity: ach.rarity ?? 'common',
        unlockedAt: ea.unlockedAt?.toISOString() ?? '',
      };
    });

  const progressMap = new Map(questProgress.map((p) => [p.quest.toString(), p]));
  const todayQuests = activeQuests.map((q) => {
    const prog = progressMap.get(q._id.toString());
    return {
      key: q.key,
      title: q.titleKey,
      current: prog?.current ?? 0,
      goal: q.goal,
      completed: prog?.completed ?? false,
    };
  });

  const upcoming = upcomingSessions.map((s) => {
    const sessionDate = new Date(s.scheduledAt).toISOString().slice(0, 10);
    return {
      id: s._id.toString(),
      title: s.title,
      subject: s.subject,
      startAt: new Date(s.scheduledAt).toISOString(),
      isToday: sessionDate === todayStr,
    };
  });

  return {
    badges: { earned: earnedBadges, totalCount: allAchievements.length },
    quests: { today: todayQuests },
    upcomingSessions: upcoming,
  };
}

interface GamificationSidebarProps {
  userId: string;
  locale: string;
}

export async function GamificationSidebar({ userId, locale }: GamificationSidebarProps) {
  let data: Awaited<ReturnType<typeof loadGamificationSummary>> | null = null;

  try {
    data = await loadGamificationSummary(userId);
  } catch (err) {
    console.error('[GamificationSidebar] failed to load:', err);
  }

  const earned = data?.badges.earned ?? [];
  const totalCount = data?.badges.totalCount ?? 0;
  const quests = data?.quests.today ?? [];
  const sessions = data?.upcomingSessions ?? [];

  return (
    <aside className="flex flex-col gap-4">
      <AchievementsCard earned={earned} totalCount={totalCount} locale={locale} />
      <DailyQuestsCard quests={quests} locale={locale} />
      <UpcomingSessionsCard sessions={sessions} locale={locale} />
    </aside>
  );
}
