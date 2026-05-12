import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Types } from 'mongoose';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import SavedExercise from '@/models/SavedExercise';
import ExerciseLike from '@/models/ExerciseLike';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { FeedItemDTO } from '@/types';

type RouteParams = { params: Promise<{ locale: string }> };

interface PopulatedAuthor {
  _id: Types.ObjectId;
  name?: string;
  avatar?: string;
  role?: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
}

interface PopulatedExercise {
  _id: Types.ObjectId;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  attachments?: string[];
  likesCount?: number;
  solutionCount?: number;
  commentsCount?: number;
  lastActivityAt?: Date;
  hasMath?: boolean;
  authorId?: PopulatedAuthor | null;
}

async function loadSaved(userId: string): Promise<FeedItemDTO[]> {
  await connectToDatabase();

  // Mirror the shape returned by /api/saves: pull each user's SavedExercise
  // docs ordered by save time, with the parent Exercise + its author populated.
  const saves = await SavedExercise.find({ userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'exerciseId',
      populate: { path: 'authorId', select: 'name avatar role isVerifiedTeacher' },
    })
    .lean<{ exerciseId: PopulatedExercise | null }[]>();

  const exercises = saves
    .map((s) => s.exerciseId)
    .filter((e): e is PopulatedExercise => Boolean(e && e._id));

  if (exercises.length === 0) return [];

  // Hydrate `isLiked` so the card shows the correct like state.
  const userObjId = new Types.ObjectId(userId);
  const exerciseIds = exercises.map((e) => e._id);
  const liked = await ExerciseLike.find({
    userId: userObjId,
    exerciseId: { $in: exerciseIds },
  })
    .select('exerciseId')
    .lean<{ exerciseId: Types.ObjectId }[]>();
  const likedSet = new Set(liked.map((l) => String(l.exerciseId)));

  return exercises.map((ex) => ({
    _id: String(ex._id),
    title: ex.title,
    description: ex.description,
    difficulty: ex.difficulty,
    subject: ex.subject,
    topic: ex.topic,
    attachments: ex.attachments ?? [],
    likesCount: ex.likesCount ?? 0,
    solutionCount: ex.solutionCount ?? 0,
    commentsCount: ex.commentsCount ?? 0,
    lastActivityAt: (ex.lastActivityAt ?? new Date()).toISOString(),
    hasMath: ex.hasMath,
    author: {
      _id: String(ex.authorId?._id ?? ''),
      name: ex.authorId?.name ?? '—',
      avatar: ex.authorId?.avatar,
      role: ex.authorId?.role ?? 'student',
      isVerifiedTeacher: ex.authorId?.isVerifiedTeacher ?? false,
    },
    isLiked: likedSet.has(String(ex._id)),
    isSaved: true,
  }));
}

export default async function SavesPage({ params }: RouteParams) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations('saves');
  const items = await loadSaved(session.userId);

  return (
    <AppShell>
      <div className="py-6 sm:py-8">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h1>
        </header>

        {items.length === 0 ? (
          <EmptyState
            variant="empty-saved"
            title={t('title')}
            description={t('empty')}
          />
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <ExerciseCard key={item._id} exercise={item} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
