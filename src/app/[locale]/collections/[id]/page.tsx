import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Types } from 'mongoose';
import { Globe2, Lock, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { AppShell } from '@/components/layout/AppShell';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Collection from '@/models/Collection';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { UserAvatar } from '@/components/ui/user-avatar';
import ReputationBadge from '@/components/profile/ReputationBadge';
import { CollectionManageBar } from '@/components/collections/collection-manage-bar';
import type { FeedItemDTO } from '@/types';

type RouteParams = { params: Promise<{ locale: string; id: string }> };

interface PopulatedAuthor {
  _id: Types.ObjectId | string;
  name?: string;
  avatar?: string;
  role?: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
  points?: number;
}

interface PopulatedExerciseDoc {
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

interface PopulatedCollectionDoc {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  visibility: 'public' | 'private';
  ownerId: PopulatedAuthor;
  exerciseIds: PopulatedExerciseDoc[];
  createdAt: Date;
  updatedAt: Date;
}

function toFeedItem(ex: PopulatedExerciseDoc): FeedItemDTO {
  return {
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
      points: ex.authorId?.points,
    },
  };
}

export default async function CollectionDetailPage({ params }: RouteParams) {
  const { locale, id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();
  const collection = (await Collection.findById(id)
    .populate({
      path: 'ownerId',
      select: 'name avatar role isVerifiedTeacher points',
    })
    .populate({
      path: 'exerciseIds',
      populate: {
        path: 'authorId',
        select: 'name avatar role isVerifiedTeacher points',
      },
    })
    .lean()) as PopulatedCollectionDoc | null;

  if (!collection) {
    notFound();
  }

  const session = await getSession();
  const ownerIdStr = String(collection.ownerId?._id ?? collection.ownerId);
  const isOwner = Boolean(session && session.userId === ownerIdStr);
  const isAdmin = session?.role === 'admin';

  if (collection.visibility === 'private' && !isOwner && !isAdmin) {
    // Private collections are gated. For unauthenticated users we send them to
    // login so they can re-attempt; otherwise show a 404-style not-found
    // (intentional: do not leak existence of private collection).
    if (!session) {
      redirect(`/${locale}/login`);
    }
    notFound();
  }

  const t = await getTranslations('collections');
  const owner = collection.ownerId;
  const exercises = (collection.exerciseIds ?? []).filter(
    (e): e is PopulatedExerciseDoc => Boolean(e && e._id)
  );
  const exerciseIdsForPicker = exercises.map((e) => String(e._id));

  return (
    <AppShell>
      <div className="py-6 sm:py-8">
        <Link
          href="/collections"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t('myCollections')}
        </Link>

        <header className="mb-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {collection.title}
              </h1>
              {collection.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {collection.description}
                </p>
              ) : null}
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                collection.visibility === 'public'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {collection.visibility === 'public' ? (
                <Globe2 className="size-3.5" />
              ) : (
                <Lock className="size-3.5" />
              )}
              {t(`visibility.${collection.visibility}`)}
            </span>
          </div>

          {/* Owner identity row */}
          {owner ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
              <UserAvatar src={owner.avatar} name={owner.name} size="sm" />
              <span className="font-medium text-foreground">{owner.name}</span>
              {typeof owner.points === 'number' && (
                <ReputationBadge points={owner.points} />
              )}
              <span className="ms-auto font-mono tabular-nums">
                {t('exerciseCount', { count: exercises.length })}
              </span>
            </div>
          ) : null}

          {isOwner && (
            <CollectionManageBar
              collectionId={String(collection._id)}
              initialTitle={collection.title}
              initialDescription={collection.description ?? ''}
              initialVisibility={collection.visibility}
              alreadyIncludedIds={exerciseIdsForPicker}
            />
          )}
        </header>

        {exercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
            {t('empty')}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {exercises.map((ex) => (
              <ExerciseCard key={String(ex._id)} exercise={toFeedItem(ex)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
