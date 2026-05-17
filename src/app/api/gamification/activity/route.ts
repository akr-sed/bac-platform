import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import XPLedger from '@/models/XPLedger';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';
import UserAchievement from '@/models/UserAchievement';
import mongoose from 'mongoose';
import type { ActivityEntryDTO } from '@/types';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.userId);
    const since = new Date(Date.now() - THIRTY_DAYS);

    const [solutions, comments, achievements] = await Promise.all([
      Solution.find({ authorId: userId, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate<{ exerciseId: { title: string } }>('exerciseId', 'title')
        .lean(),
      Comment.find({ authorId: userId, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      UserAchievement.find({
        user: userId,
        unlockedAt: { $gte: since },
      })
        .sort({ unlockedAt: -1 })
        .limit(20)
        .populate<{ achievement: { titleKey: string } }>('achievement', 'titleKey')
        .lean(),
    ]);

    const entries: ActivityEntryDTO[] = [];

    for (const sol of solutions) {
      const ex = sol.exerciseId as unknown as { title?: string } | null;
      entries.push({
        at: (sol.createdAt as Date).toISOString(),
        kind: 'exercise-solved',
        title: ex?.title ?? 'Exercise',
        meta: { solutionId: sol._id.toString() },
      });
    }

    for (const c of comments) {
      entries.push({
        at: (c.createdAt as Date).toISOString(),
        kind: 'comment',
        title: 'Comment posted',
        meta: { commentId: c._id.toString() },
      });
    }

    for (const ua of achievements) {
      const ach = ua.achievement as unknown as { titleKey?: string } | null;
      entries.push({
        at: ua.unlockedAt!.toISOString(),
        kind: 'achievement',
        title: ach?.titleKey ?? 'Achievement unlocked',
        meta: { achievementId: ua.achievement?.toString() },
      });
    }

    // Sort by date desc, take 20
    entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const recent = entries.slice(0, 20);

    return NextResponse.json({ activity: recent });
  } catch (err) {
    console.error('[gamification/activity]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
