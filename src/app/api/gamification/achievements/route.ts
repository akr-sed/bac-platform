import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Achievement from '@/models/Achievement';
import UserAchievement from '@/models/UserAchievement';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.userId);

    const [allAchievements, userAchievements] = await Promise.all([
      Achievement.find({}).lean(),
      UserAchievement.find({ user: userId }).lean(),
    ]);

    const earnedMap = new Map(
      userAchievements.map((ua) => [ua.achievement.toString(), ua])
    );

    const result = allAchievements.map((ach) => {
      const ua = earnedMap.get(ach._id.toString());
      return {
        key: ach.key,
        title: ach.titleKey,
        description: ach.descriptionKey,
        icon: ach.icon,
        rarity: ach.rarity,
        xpReward: ach.xpReward,
        unlocked: !!ua?.unlockedAt,
        unlockedAt: ua?.unlockedAt?.toISOString() ?? null,
        progress: ua?.progress ?? 0,
      };
    });

    return NextResponse.json({ achievements: result });
  } catch (err) {
    console.error('[gamification/achievements]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
