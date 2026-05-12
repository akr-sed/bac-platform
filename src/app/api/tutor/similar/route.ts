// src/app/api/tutor/similar/route.ts
//
// Wave D — AI Tutor SCAFFOLD ENDPOINT.
//
// Returns three "similar" exercises by sampling random documents from
// the Exercise collection (excluding the current one). The `reason` is
// a deterministic placeholder string — the eventual LLM/embedding
// implementation should replace it without changing the response shape.

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

const PLACEHOLDER_REASON = 'Practices the same conservation-of-energy pattern.';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const exerciseId = searchParams.get('exerciseId');
  if (!exerciseId) {
    return NextResponse.json(
      { error: 'exerciseId query parameter is required' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Build a $match that excludes the current exercise when the id is a
  // valid ObjectId — otherwise just sample three random exercises.
  const match: Record<string, unknown> = {};
  if (Types.ObjectId.isValid(exerciseId)) {
    match._id = { $ne: new Types.ObjectId(exerciseId) };
  }

  const docs = await Exercise.aggregate<{
    _id: Types.ObjectId;
    title: string;
    subject: string;
  }>([
    { $match: match },
    { $sample: { size: 3 } },
    { $project: { _id: 1, title: 1, subject: 1 } },
  ]);

  const similar = docs.map((d) => ({
    exerciseId: String(d._id),
    title: d.title,
    subject: d.subject,
    reason: PLACEHOLDER_REASON,
  }));

  return NextResponse.json({
    similar,
    __placeholder: true,
  });
}
