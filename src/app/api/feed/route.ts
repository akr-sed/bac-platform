// src/app/api/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import User from '@/models/User';
import ExerciseLike from '@/models/ExerciseLike';
import SavedExercise from '@/models/SavedExercise';
import Follow from '@/models/Follow';
import {
  buildFeedPipeline,
  parseFeedAuthorRole,
  parseFeedFilter,
  parseFeedSort,
} from '@/lib/feed-ranking';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'));
  const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') ?? '10')));
  const sort = parseFeedSort(searchParams.get('sort'));
  const filter = parseFeedFilter(searchParams.get('filter'));
  const authorRole = parseFeedAuthorRole(searchParams.get('authorRole'));
  const rawTopic = searchParams.get('topic');
  const topic = rawTopic && rawTopic.length > 0 ? rawTopic : undefined;

  await connectToDatabase();

  // ── Following filter: resolve the viewer's followee list first. If they
  //    follow nobody, return an empty page without hitting the aggregation.
  let authorIds: Types.ObjectId[] | undefined;
  if (filter === 'following') {
    const followees = await Follow.find({ follower: session.userId }).distinct(
      'followee'
    );
    if (followees.length === 0) {
      return NextResponse.json({
        data: [],
        page,
        sort,
        filter,
        authorRole,
        hasMore: false,
        totalCount: 0,
      });
    }
    authorIds = followees.map((id) => new Types.ObjectId(String(id)));
  }

  // "for-you" is the only mode that consumes subject preferences; skip the
  // user fetch entirely for the other modes.
  const preferredSubjects: string[] =
    sort === 'for-you'
      ? (await User.findById(session.userId).select('preferences'))?.preferences?.subjects ?? []
      : [];

  const pipeline = buildFeedPipeline({
    preferredSubjects,
    page,
    limit,
    sort,
    authorIds,
    authorRole: authorRole ?? undefined,
    topic,
  });
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

  return NextResponse.json({
    data,
    page,
    sort,
    filter,
    authorRole,
    hasMore: items.length === limit,
  });
}
