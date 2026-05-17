// src/app/api/exercises/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import ExerciseLike from '@/models/ExerciseLike';
import Exercise from '@/models/Exercise';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: exerciseId } = await ctx.params;

  await connectToDatabase();
  const existing = await ExerciseLike.findOne({ userId: session.userId, exerciseId });

  if (existing) {
    await ExerciseLike.findOneAndDelete({ _id: existing._id });
    const ex = await Exercise.findById(exerciseId).select('likesCount');
    return NextResponse.json({ liked: false, likesCount: ex?.likesCount ?? 0 });
  }

  try {
    await ExerciseLike.create({ userId: session.userId, exerciseId });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code !== 11000) throw err;
  }
  const ex = await Exercise.findById(exerciseId).select('likesCount');
  return NextResponse.json({ liked: true, likesCount: ex?.likesCount ?? 0 });
}
