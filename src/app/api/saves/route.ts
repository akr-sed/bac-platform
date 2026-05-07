// src/app/api/saves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import SavedExercise from '@/models/SavedExercise';
import Exercise from '@/models/Exercise';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();

  const saves = await SavedExercise.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'exerciseId',
      populate: { path: 'authorId', select: 'name avatar role isVerifiedTeacher' },
    });

  return NextResponse.json({ data: saves.map((s) => s.exerciseId) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { exerciseId } = await request.json();
  if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

  await connectToDatabase();
  const exists = await Exercise.findById(exerciseId).select('_id');
  if (!exists) return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });

  try {
    await SavedExercise.create({ userId: session.userId, exerciseId });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code !== 11000) throw err; // duplicate key = already saved, idempotent
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
