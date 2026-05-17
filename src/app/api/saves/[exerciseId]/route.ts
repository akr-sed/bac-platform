// src/app/api/saves/[exerciseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import SavedExercise from '@/models/SavedExercise';

type Ctx = { params: Promise<{ exerciseId: string }> };

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { exerciseId } = await ctx.params;
  await connectToDatabase();
  await SavedExercise.deleteOne({ userId: session.userId, exerciseId });
  return NextResponse.json({ ok: true });
}
