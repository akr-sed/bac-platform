import { Types } from 'mongoose';
import { Sparkle } from 'lucide-react';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import User from '@/models/User';
import ExerciseLike from '@/models/ExerciseLike';
import SavedExercise from '@/models/SavedExercise';
import Follow from '@/models/Follow';
import {
  buildFeedPipeline,
  type FeedFilter,
  type FeedSort,
} from '@/lib/feed-ranking';
import { AppShell } from '@/components/layout/AppShell';
import { FeedList } from '@/components/exercises/feed-list';
import { QuickActionBar } from '@/components/teacher/QuickActionBar';
import { UpcomingClassesPanel } from '@/components/teacher/UpcomingClassesPanel';
import type { FeedItemDTO } from '@/types';

interface Props {
  userId: string;
  userName: string;
  locale: string;
  sort: FeedSort;
  filter: FeedFilter;
}

const INITIAL_FEED_LIMIT = 10;

/**
 * Mirrors `HomeFeed.loadFeed` so the teacher sees the SAME feed content a
 * student would for any given sort + filter combination. No authorRole
 * filter, no special "student questions only" carve-out — the only
 * teacher-specific surfaces are the QuickActionBar above the feed and the
 * UpcomingClassesPanel on the end-side.
 */
async function loadFeed(
  userId: string,
  sort: FeedSort,
  filter: FeedFilter
): Promise<FeedItemDTO[]> {
  await connectToDatabase();

  let preferredSubjects: string[] = [];
  if (sort === 'for-you') {
    const user = await User.findById(userId).select('preferences').lean();
    type UserDoc = { preferences?: { subjects?: string[] } } | null;
    preferredSubjects = (user as UserDoc)?.preferences?.subjects ?? [];
  }

  let authorIds: Types.ObjectId[] | undefined;
  if (filter === 'following') {
    const followees = await Follow.find({ follower: userId }).distinct(
      'followee'
    );
    if (followees.length === 0) return [];
    authorIds = followees.map((id) => new Types.ObjectId(String(id)));
  }

  const pipeline = buildFeedPipeline({
    preferredSubjects,
    page: 0,
    limit: INITIAL_FEED_LIMIT,
    sort,
    authorIds,
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
 *   [VerticalNavRail | QuickActionBar + standard feed | UpcomingClassesPanel]
 *
 * The feed itself is identical to the student feed — same For You /
 * Trending / Latest tabs, same Following filter, same cards, same actions.
 * Teachers see the regular content; what differs is the surrounding
 * scaffolding (sidebar items per role, quick actions row, and the
 * upcoming-classes end panel).
 */
export async function TeacherHomeFeed({ userId, userName, locale, sort, filter }: Props) {
  const items = await loadFeed(userId, sort, filter);
  const isAr = locale === 'ar';
  const firstName = userName.split(' ')[0];

  return (
    <AppShell endPanel={<UpcomingClassesPanel userId={userId} locale={locale} />}>
      <div className="py-6 sm:py-8">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {firstName}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {isAr ? `أهلاً، ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
        </header>

        <QuickActionBar />

        <section aria-labelledby="feed-h" className="mt-6">
          <h2
            id="feed-h"
            className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
          >
            {isAr ? 'التمارين الأخيرة' : 'Latest exercises'}
          </h2>
          {items.length === 0 && filter === 'all' ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <Sparkle className="mx-auto mb-3 size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'لا توجد تمارين بعد. تابعونا قريبًا.'
                  : 'No exercises yet. Check back soon.'}
              </p>
            </div>
          ) : (
            <FeedList
              initialItems={items}
              endpoint="/api/feed"
              initialSort={sort}
              initialFilter={filter}
              pageSize={INITIAL_FEED_LIMIT}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default TeacherHomeFeed;
