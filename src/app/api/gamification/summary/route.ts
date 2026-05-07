import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { xpToNextLevel } from '@/lib/gamification';
import User from '@/models/User';
import Achievement from '@/models/Achievement';
import UserAchievement from '@/models/UserAchievement';
import DailyQuest from '@/models/DailyQuest';
import UserQuestProgress from '@/models/UserQuestProgress';
import Session from '@/models/Session';
import mongoose from 'mongoose';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildStreakWeek(today: Date): { date: string; ok: boolean }[] {
  // last 7 days ending today
  const days: { date: string; ok: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: toDateString(d), ok: false });
  }
  return days;
}

export async function GET() {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.userId);
    const today = new Date();
    const todayStr = toDateString(today);

    const [user, allAchievements, earnedAchievements, activeQuests, questProgress, upcomingSessions] =
      await Promise.all([
        User.findById(userId).select('xp level streakDays streakLastDay nationalRank').lean(),
        Achievement.find({}).lean(),
        UserAchievement.find({ user: userId, unlockedAt: { $exists: true } })
          .populate<{ achievement: { key: string; titleKey: string; descriptionKey: string; icon: string; rarity: string; xpReward: number } }>('achievement')
          .lean(),
        DailyQuest.find({ active: true }).lean(),
        UserQuestProgress.find({ user: userId, date: todayStr }).lean(),
        Session.find({
          status: { $in: ['scheduled', 'live'] },
          scheduledAt: { $gte: today },
        })
          .sort({ scheduledAt: 1 })
          .limit(3)
          .select('title subject scheduledAt')
          .lean(),
      ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const xp = user.xp ?? 0;
    const levelProgress = xpToNextLevel(xp);

    // Streak week: mark days within streakDays as ok
    const streakWeek = buildStreakWeek(today);
    const streakDays = user.streakDays ?? 0;
    for (let i = 0; i < Math.min(streakDays, 7); i++) {
      streakWeek[6 - i].ok = true;
    }

    // Badges
    const earnedKeys = new Set(
      earnedAchievements.map((ea) => (ea.achievement as unknown as { key: string })?.key)
    );
    const earned = earnedAchievements
      .filter((ea) => ea.achievement)
      .map((ea) => {
        const ach = ea.achievement as unknown as {
          key: string;
          titleKey: string;
          descriptionKey: string;
          icon: string;
          rarity: string;
          xpReward: number;
        };
        return {
          key: ach.key,
          title: ach.titleKey,
          description: ach.descriptionKey,
          icon: ach.icon,
          rarity: ach.rarity,
          xpReward: ach.xpReward,
          unlockedAt: ea.unlockedAt?.toISOString() ?? '',
        };
      });
    const lockedCount = allAchievements.filter((a) => !earnedKeys.has(a.key)).length;

    // Quests
    const progressMap = new Map(
      questProgress.map((p) => [p.quest.toString(), p])
    );
    const todayQuests = activeQuests.map((q) => {
      const prog = progressMap.get(q._id.toString());
      return {
        key: q.key,
        title: q.titleKey,
        current: prog?.current ?? 0,
        goal: q.goal,
        completed: prog?.completed ?? false,
        rewardXp: q.rewardXp,
      };
    });

    // Upcoming sessions
    const upcoming = upcomingSessions.map((s) => {
      const sessionDate = toDateString(new Date(s.scheduledAt));
      return {
        id: s._id.toString(),
        title: s.title,
        subject: s.subject,
        startAt: new Date(s.scheduledAt).toISOString(),
        isToday: sessionDate === todayStr,
      };
    });

    return NextResponse.json(
      {
        user: {
          xp,
          level: user.level ?? 1,
          levelProgress,
          streakDays,
          streakWeek,
          nationalRank: user.nationalRank ?? 0,
        },
        badges: { earned, lockedCount },
        quests: { today: todayQuests },
        upcomingSessions: upcoming,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (err) {
    console.error('[gamification/summary]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
