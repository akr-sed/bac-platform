// src/app/api/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import User from '@/models/User';
import ExerciseLike from '@/models/ExerciseLike';
import SavedExercise from '@/models/SavedExercise';
import { buildFeedPipeline, parseFeedSort } from '@/lib/feed-ranking';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'));
  const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') ?? '10')));
  const sort = parseFeedSort(searchParams.get('sort'));

  await connectToDatabase();
  // "for-you" is the only mode that consumes subject preferences; skip the
  // user fetch entirely for the other modes.
  const preferredSubjects: string[] =
    sort === 'for-you'
      ? (await User.findById(session.userId).select('preferences'))?.preferences?.subjects ?? []
      : [];

  const pipeline = buildFeedPipeline({ preferredSubjects, page, limit, sort });
  const items = await Exercise.aggregate(pipeline);

  // Attach isLiked / isSaved for the current user
  const userObjectId = new Types.ObjectId(session.userId);
  const exerciseIds = items.map((i: { _id: Types.ObjectId }) => i._id);
  const [liked, saved] = await Promise.all([
    ExerciseLike.find({ userId: userObjectId, exerciseId: { $in: exerciseIds } }).select('exerciseId'),
    SavedExercise.find({ userId: userObjectId, exerciseId: { $in: exerciseIds } }).select('exerciseId'),
  ]);
  const likedSet = new Set(liked.map((l) => String(l.exerciseId)));
  const savedSet = new Set(saved.map((s) => String(s.exerciseId)));

  const data = items.map((i: { _id: Types.ObjectId; author: { _id: Types.ObjectId } & Record<string, unknown> } & Record<string, unknown>) => ({
    ...i,
    _id: String(i._id),
    author: { ...i.author, _id: String(i.author._id) },
    isLiked: likedSet.has(String(i._id)),
    isSaved: savedSet.has(String(i._id)),
  }));

  return NextResponse.json({ data, page, sort, hasMore: items.length === limit });
}
