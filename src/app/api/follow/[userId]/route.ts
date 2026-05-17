// src/app/api/follow/[userId]/route.ts
// Wave C1 — Follow / Unfollow toggle endpoints.
//
// POST   → start following `userId`. 409 if already following, 400 if self.
// DELETE → stop following `userId` (idempotent, returns 200 even if no doc).
// GET    → returns `{ following, followersCount, followingCount }` for
//          the URL's user, viewed by the current viewer.
import { NextRequest, NextResponse } from 'next/server';
import { Types, isValidObjectId } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Follow from '@/models/Follow';
import User from '@/models/User';

type Ctx = { params: Promise<{ userId: string }> };

async function readCounts(userId: string | Types.ObjectId) {
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ followee: userId }),
    Follow.countDocuments({ follower: userId }),
  ]);
  return { followersCount, followingCount };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId } = await ctx.params;
  if (!isValidObjectId(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  await connectToDatabase();

  const [existing, counts] = await Promise.all([
    Follow.exists({ follower: session.userId, followee: userId }),
    readCounts(userId),
  ]);

  return NextResponse.json({
    following: Boolean(existing),
    ...counts,
  });
}

export async function POST(_request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId } = await ctx.params;
  if (!isValidObjectId(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }
  if (userId === session.userId) {
    return NextResponse.json(
      { error: 'Cannot follow yourself' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const target = await User.exists({ _id: userId });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    await Follow.create({ follower: session.userId, followee: userId });
  } catch (err: unknown) {
    // Duplicate key = already following → 409 with current counts so the
    // client can reconcile state without an extra round-trip.
    if ((err as { code?: number })?.code === 11000) {
      const counts = await readCounts(userId);
      return NextResponse.json(
        { error: 'Already following', following: true, ...counts },
        { status: 409 }
      );
    }
    throw err;
  }

  const counts = await readCounts(userId);
  return NextResponse.json({ following: true, ...counts }, { status: 201 });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId } = await ctx.params;
  if (!isValidObjectId(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  await connectToDatabase();
  await Follow.deleteOne({ follower: session.userId, followee: userId });

  const counts = await readCounts(userId);
  return NextResponse.json({ following: false, ...counts });
}
