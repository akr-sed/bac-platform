import { Types } from 'mongoose';
import { getTranslations } from 'next-intl/server';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import ExerciseLike from '@/models/ExerciseLike';
import SavedExercise from '@/models/SavedExercise';
import { buildFeedPipeline } from '@/lib/feed-ranking';
import { AppShell } from '@/components/layout/AppShell';
import { QuickActionBar } from '@/components/teacher/QuickActionBar';
import { UpcomingClassesPanel } from '@/components/teacher/UpcomingClassesPanel';
import { TeacherFeedList } from '@/components/feed/teacher-feed-list';
import type { FeedItemDTO } from '@/types';

interface Props {
  userId: string;
  userName: string;
  locale: string;
}

const INITIAL_FEED_LIMIT = 10;

/**
 * Server-side teacher feed loader — mirrors `HomeFeed.loadFeed` but always
 * pins `sort='latest'` and `authorRole='student'` because the teacher home
 * page only surfaces fresh student questions awaiting an answer.
 *
 * We call `buildFeedPipeline` directly rather than HTTP-looping back to
 * `/api/feed` — same rationale as `fetchSessionsList` in `src/lib/sessions.ts`.
 */
async function loadStudentFeed(userId: string): Promise<FeedItemDTO[]> {
  await connectToDatabase();

  const pipeline = buildFeedPipeline({
    preferredSubjects: [],
    page: 0,
    limit: INITIAL_FEED_LIMIT,
    sort: 'latest',
    authorRole: 'student',
  });
  const items = await Exercise.aggregate(pipeline);

  if (items.length === 0) return [];

  const userObjId = new Types.ObjectId(userId);
  const exerciseIds = items.map((i: { _id: Types.ObjectId }) => i._id);
  const [liked, saved] = await Promise.all([
    ExerciseLike.find({
      userId: userObjId,
      exerciseId: { $in: exerciseIds },
    })
      .select('exerciseId')
      .lean(),
    SavedExercise.find({
      userId: userObjId,
      exerciseId: { $in: exerciseIds },
    })
      .select('exerciseId')
      .lean(),
  ]);
  const likedSet = new Set(liked.map((l) => String(l.exerciseId)));
  const savedSet = new Set(saved.map((s) => String(s.exerciseId)));

  return items.map((i: {
    _id: Types.ObjectId;
    author: { _id: Types.ObjectId } & Record<string, unknown>;
  } & Record<string, unknown>) => ({
    ...i,
    _id: String(i._id),
    author: { ...i.author, _id: String(i.author._id) },
    isLiked: likedSet.has(String(i._id)),
    isSaved: savedSet.has(String(i._id)),
  })) as unknown as FeedItemDTO[];
}

/**
 * Teacher-only home page.
 *
 * Layout (logical, flips for RTL):
 *
 *   [VerticalNavRail | main:  header + QuickActionBar + TeacherFeedList | UpcomingClassesPanel ]
 *
 * The student `HomeFeed` shows greeting + sort tabs + "for-you" exercises.
 * Teachers don't want their own questions re-surfaced; they want a tight
 * stream of recent STUDENT questions to triage, with quick CTAs to act on
 * each one.
 */
export async function TeacherHomeFeed({ userId, userName, locale }: Props) {
  const [items, t] = await Promise.all([
    loadStudentFeed(userId),
    getTranslations('teacher'),
  ]);
  const firstName = userName.split(' ')[0];

  return (
    <AppShell endPanel={<UpcomingClassesPanel userId={userId} locale={locale} />}>
      <div className="py-6 sm:py-8">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {firstName}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('feedTitle')}
          </h1>
        </header>

        <QuickActionBar />

        <TeacherFeedList
          initialItems={items}
          pageSize={INITIAL_FEED_LIMIT}
        />
      </div>
    </AppShell>
  );
}

export default TeacherHomeFeed;
