import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { unstable_cache } from 'next/cache';
import mongoose from 'mongoose';
import type { LeaderboardEntry } from '@/types';

/**
 * GET /api/leaderboard
 * Query: period=week|month|all, stream=sciences|math|lettres|tech-math|languages|all
 * Returns: { entries: LeaderboardEntry[] }
 *
 * Points formula:
 *   1 pt per ExerciseLike received (on exercises authored by the user)
 *   3 pts per Solution posted
 *   (SessionAttendance skipped — no SessionAttendance model in this codebase;
 *    SessionEnrollment exists but spec §6.8 says skip if no SessionAttendance)
 *
 * Cached 5 min per period:stream key.
 */

function startOfPeriod(period: string): Date | null {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  return null; // 'all' — no date filter
}

async function computeLeaderboard(period: string, stream: string): Promise<LeaderboardEntry[]> {
  await connectToDatabase();

  // Dynamically import models so they are registered before aggregation
  await import('@/models/ExerciseLike');
  await import('@/models/Solution');
  await import('@/models/Exercise');
  await import('@/models/User');

  const ExerciseLike = mongoose.model('ExerciseLike');
  const Solution = mongoose.model('Solution');
  const User = mongoose.model('User');
  const Exercise = mongoose.model('Exercise');

  const since = startOfPeriod(period);

  // ── Likes received: join ExerciseLike → Exercise to get authorId ──────────
  const likeFilter: Record<string, unknown> = {};
  if (since) likeFilter.createdAt = { $gte: since };

  const likePoints = await ExerciseLike.aggregate([
    { $match: likeFilter },
    {
      $lookup: {
        from: 'exercises',
        localField: 'exerciseId',
        foreignField: '_id',
        as: 'exercise',
      },
    },
    { $unwind: '$exercise' },
    {
      $group: {
        _id: '$exercise.authorId',
        pts: { $sum: 1 },
      },
    },
  ]);

  // ── Solutions posted ──────────────────────────────────────────────────────
  const solFilter: Record<string, unknown> = {};
  if (since) solFilter.createdAt = { $gte: since };

  const solutionPoints = await Solution.aggregate([
    { $match: solFilter },
    {
      $group: {
        _id: '$authorId',
        pts: { $sum: 3 },
      },
    },
  ]);

  // ── Merge into a map: userId → total points ───────────────────────────────
  const pointsMap = new Map<string, number>();
  for (const { _id, pts } of likePoints) {
    const key = _id.toString();
    pointsMap.set(key, (pointsMap.get(key) ?? 0) + pts);
  }
  for (const { _id, pts } of solutionPoints) {
    const key = _id.toString();
    pointsMap.set(key, (pointsMap.get(key) ?? 0) + pts);
  }

  if (pointsMap.size === 0) return [];

  // ── Fetch user details ────────────────────────────────────────────────────
  const userIds = Array.from(pointsMap.keys()).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const userFilter: Record<string, unknown> = { _id: { $in: userIds } };
  if (stream && stream !== 'all') {
    userFilter['preferences.stream'] = stream;
  }

  const users = await User.find(userFilter)
    .select('_id name avatar preferences')
    .lean();

  // ── Build sorted list ─────────────────────────────────────────────────────
  const entries = users.map((u: any) => ({
    userId: u._id.toString(),
    points: pointsMap.get(u._id.toString()) ?? 0,
    name: u.name as string,
    avatar: (u.avatar as string | undefined) ?? null,
    stream: (u.preferences?.stream as string | undefined) ?? undefined,
  }));

  entries.sort((a, b) => b.points - a.points);

  return entries.slice(0, 100).map((e, i) => ({
    user: {
      id: e.userId,
      name: e.name,
      avatarUrl: e.avatar,
      stream: e.stream,
    },
    points: e.points,
    rank: i + 1,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = ['week', 'month', 'all'].includes(searchParams.get('period') ?? '')
      ? (searchParams.get('period') as string)
      : 'week';
    const stream = searchParams.get('stream') ?? 'all';

    const getCached = unstable_cache(
      () => computeLeaderboard(period, stream),
      [`leaderboard:${period}:${stream}`],
      { revalidate: 300 } // 5 minutes
    );

    const entries = await getCached();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('[GET /api/leaderboard]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
