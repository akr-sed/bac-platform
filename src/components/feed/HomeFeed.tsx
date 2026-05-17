import { Sparkle, Flame, Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import User from '@/models/User';
import ExerciseLike from '@/models/ExerciseLike';
import SavedExercise from '@/models/SavedExercise';
import Follow from '@/models/Follow';
import {
  buildFeedPipeline,
  parseFeedFilter,
  parseFeedSort,
  type FeedFilter,
  type FeedSort,
} from '@/lib/feed-ranking';
import { Types } from 'mongoose';
import { FeedList } from '@/components/exercises/feed-list';
import { FeedTopicChips } from '@/components/feed/feed-topic-chips';
import { Logo } from '@/components/brand/Logo';
import { AppShell } from '@/components/layout/AppShell';
import { GamificationSidebar } from '@/components/dashboard/GamificationSidebar';
import type { ExamTopicLocale } from '@/lib/exam-topic-labels';
import type { FeedItemDTO } from '@/types';

interface Props {
  userId: string;
  userName: string;
  locale: string;
  /**
   * Active feed sort. Defaults to "for-you" when missing. Driven by
   * `?sort=` on the home page so refresh / share keeps state.
   */
  sort?: FeedSort;
  /**
   * Active feed filter. Defaults to "all". Driven by `?filter=` on the
   * home page. Wave C1 introduces "following".
   */
  filter?: FeedFilter;
  /** Optional topic slug filter — e.g. `analyse`, `probabilites`. */
  topic?: string;
}

const BAC_DATE = new Date('2026-06-01T08:00:00+01:00');
const INITIAL_FEED_LIMIT = 10;

function daysUntilBac(): number {
  return Math.max(0, Math.ceil((BAC_DATE.getTime() - Date.now()) / 86400000));
}

async function loadFeed(
  userId: string,
  sort: FeedSort,
  filter: FeedFilter,
  topic?: string,
): Promise<FeedItemDTO[]> {
  await connectToDatabase();
  // Only "for-you" consumes preferences; skip the user fetch otherwise.
  let preferredSubjects: string[] = [];
  if (sort === 'for-you') {
    const user = await User.findById(userId).select('preferences').lean();
    type UserDoc = { preferences?: { subjects?: string[] } } | null;
    preferredSubjects = (user as UserDoc)?.preferences?.subjects ?? [];
  }

  // Resolve followee list when the viewer wants the following feed. If they
  // follow nobody, short-circuit to an empty page.
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
    topic,
  });
  const items = await Exercise.aggregate(pipeline);

  const userObjId = new Types.ObjectId(userId);
  const exerciseIds = items.map((i: { _id: Types.ObjectId }) => i._id);
  const [liked, saved] = await Promise.all([
    ExerciseLike.find({
      userId: userObjId,
      exerciseId: { $in: exerciseIds },
    }).select('exerciseId').lean(),
    SavedExercise.find({
      userId: userObjId,
      exerciseId: { $in: exerciseIds },
    }).select('exerciseId').lean(),
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

export async function HomeFeed({ userId, userName, locale, sort, filter, topic }: Props) {
  const activeSort: FeedSort = parseFeedSort(sort);
  const activeFilter: FeedFilter = parseFeedFilter(filter);
  const items = await loadFeed(userId, activeSort, activeFilter, topic);

  // Available topics for the chip row — distinct values across the unfiltered
  // feed scope (so chips don't disappear when one is selected).
  await connectToDatabase();
  const availableTopics = (await Exercise.distinct('topic')).filter(
    (t): t is string => typeof t === 'string' && t.length > 0
  );
  const isAr = locale === 'ar';
  const days = daysUntilBac();
  // Defensive: session.name CAN be undefined for legacy accounts seeded
  // before the name field became required.
  const firstName = (userName ?? '').split(' ')[0] || (isAr ? 'صديقي' : 'there');

  return (
    <AppShell endPanel={<GamificationSidebar userId={userId} locale={locale} />}>
      <div className="py-6 sm:py-8">
        {/* Greeting band */}
        <header className="mb-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Logo variant="mark" className="text-primary" />
            <span>
              {isAr ? 'تغذيتك اليوم' : 'your feed today'}
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {isAr
                ? `أهلاً، ${firstName}`
                : `Welcome back, ${firstName}`}
            </h1>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
              <Flame className="size-3.5 text-primary" />
              <span className="text-muted-foreground">
                {isAr ? 'البكالوريا' : 'BAC'}
              </span>
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {days}
              </span>
              <span className="text-muted-foreground">
                {isAr ? (days === 1 ? 'يوم' : 'يوم') : days === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </header>

        <section aria-labelledby="feed-h" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="feed-h"
              className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
            >
              {isAr ? 'التمارين الأخيرة' : 'Latest exercises'}
            </h2>
          </div>

          {/* Compose CTA — primary entry point for posting an exercise. Lives at
              the top of the feed so it replaces the "Compose" button that used
              to live on the (now-removed) /exercises listing page. */}
          <Link
            href="/exercises/new"
            className="group flex items-center justify-between gap-4 rounded-[12px] border border-dashed border-[#B0DEF1] bg-[#F0F9FE] px-5 py-4 text-sm transition-colors hover:border-[#0095D1] hover:bg-[#E6F4FA]"
          >
            <span className="flex items-center gap-3">
              <span
                className="inline-flex size-9 items-center justify-center rounded-full bg-[#0095D1] text-white transition-transform group-hover:scale-105"
                aria-hidden="true"
              >
                <Plus className="size-4" />
              </span>
              <span className="flex flex-col text-start">
                <span className="font-semibold text-[#171C20]">
                  {isAr ? 'انشر تمرينك' : 'Post an exercise'}
                </span>
                <span className="text-xs text-[#3E4850]">
                  {isAr
                    ? 'شارك سؤالاً مع المجتمع واحصل على حلول.'
                    : 'Share a question with the community and get solutions.'}
                </span>
              </span>
            </span>
            <span className="hidden text-xs font-semibold text-[#0095D1] sm:inline">
              {isAr ? 'ابدأ ←' : '→ Compose'}
            </span>
          </Link>

          <FeedTopicChips
            topics={availableTopics}
            selected={topic ?? null}
            locale={(locale === 'fr' || locale === 'en' ? locale : 'ar') as ExamTopicLocale}
            sort={activeSort}
            filter={activeFilter}
          />

          {items.length === 0 && activeFilter === 'all' && !topic ? (
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
              initialSort={activeSort}
              initialFilter={activeFilter}
              initialTopic={topic}
              pageSize={INITIAL_FEED_LIMIT}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
