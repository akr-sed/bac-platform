import { Sparkle, Flame } from 'lucide-react';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import User from '@/models/User';
import ExerciseLike from '@/models/ExerciseLike';
import SavedExercise from '@/models/SavedExercise';
import { buildFeedPipeline } from '@/lib/feed-ranking';
import { Types } from 'mongoose';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { UpcomingSessionsRail } from '@/components/sessions/upcoming-sessions-rail';
import { TeacherSessionsSection } from '@/components/sessions/teacher-sessions-section';
import { Logo } from '@/components/brand/Logo';
import { fetchSessionsList } from '@/lib/sessions';
import type { FeedItemDTO } from '@/types';

interface Props {
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'admin';
  locale: string;
}

const BAC_DATE = new Date('2026-06-01T08:00:00+01:00');

function daysUntilBac(): number {
  return Math.max(0, Math.ceil((BAC_DATE.getTime() - Date.now()) / 86400000));
}

async function loadFeed(userId: string): Promise<FeedItemDTO[]> {
  await connectToDatabase();
  const user = await User.findById(userId).select('preferences').lean();
  type UserDoc = { preferences?: { subjects?: string[] } } | null;
  const preferredSubjects: string[] =
    (user as UserDoc)?.preferences?.subjects ?? [];

  const pipeline = buildFeedPipeline({
    preferredSubjects,
    page: 0,
    limit: 12,
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

export async function HomeFeed({ userId, userName, userRole, locale }: Props) {
  const isTeacher = userRole === 'teacher' || userRole === 'admin';
  const [items, upcomingResult, teacherResult] = await Promise.all([
    loadFeed(userId),
    fetchSessionsList({ upcoming: true, limit: 5, viewerUserId: userId }),
    isTeacher
      ? fetchSessionsList({
          teacherId: userId,
          limit: 10,
          viewerUserId: userId,
        })
      : Promise.resolve({ data: [], total: 0, page: 1, totalPages: 1 }),
  ]);
  const isAr = locale === 'ar';
  const days = daysUntilBac();
  const firstName = userName.split(' ')[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Greeting band */}
      <header className="mb-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <Logo showWordmark={false} className="text-primary" />
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

      {isTeacher && teacherResult.data.length > 0 && (
        <div className="mb-8">
          <TeacherSessionsSection sessions={teacherResult.data} />
        </div>
      )}

      {upcomingResult.data.length > 0 && (
        <div className="mb-8">
          <UpcomingSessionsRail sessions={upcomingResult.data} />
        </div>
      )}

      <section aria-labelledby="feed-h">
        <h2
          id="feed-h"
          className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
        >
          {isAr ? 'التمارين الأخيرة' : 'Latest exercises'}
        </h2>
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <Sparkle className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'لا توجد تمارين بعد. تابعونا قريبًا.'
                : 'No exercises yet. Check back soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <ExerciseCard key={item._id} exercise={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
