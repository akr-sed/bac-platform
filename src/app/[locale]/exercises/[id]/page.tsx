'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/components/providers/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SolutionList from '@/components/solutions/SolutionList';
import AttachmentViewer from '@/components/exercises/AttachmentViewer';
import type { ExerciseDTO } from '@/types';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
} as const;

export default function ExerciseDetailPage() {
  const t = useTranslations('exercises.detail');
  const tDiff = useTranslations('exercises.difficulty');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [exercise, setExercise] = useState<ExerciseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchExercise() {
      try {
        const res = await fetch(`/api/exercises/${id}`);
        if (res.ok) {
          setExercise(await res.json());
        } else {
          setError('Exercise not found');
        }
      } catch {
        setError(tCommon('error'));
      } finally {
        setLoading(false);
      }
    }
    fetchExercise();
  }, [id, tCommon]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-center text-slate-500">{tCommon('loading')}</p>
      </main>
    );
  }

  if (error || !exercise) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-center text-red-600">{error}</p>
      </main>
    );
  }

  const isAuthor = user?._id === exercise.author?._id;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{exercise.subject}</Badge>
            <Badge variant="outline">{exercise.topic}</Badge>
            {exercise.subtopic && (
              <Badge variant="outline">{exercise.subtopic}</Badge>
            )}
            <Badge className={difficultyColors[exercise.difficulty]}>
              {tDiff(exercise.difficulty)}
            </Badge>
          </div>
          {isAuthor && (
            <Link href={`/exercises/${exercise._id}/edit`}>
              <Button variant="outline" size="sm">
                {tCommon('edit')}
              </Button>
            </Link>
          )}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
          {exercise.title}
        </h1>

        <div className="mt-4 whitespace-pre-wrap text-slate-700">
          {exercise.description}
        </div>

        <AttachmentViewer attachments={exercise.attachments} />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              {t('postedBy')}
            </p>
            <p className="mt-1 text-slate-950">{exercise.author?.name}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              {t('postedAt')}
            </p>
            <p className="mt-1 text-slate-950">
              {new Date(exercise.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-950">
          {t('solutions')} ({exercise.solutionCount})
        </h2>
        <SolutionList exerciseId={exercise._id} />
      </section>
    </main>
  );
}
