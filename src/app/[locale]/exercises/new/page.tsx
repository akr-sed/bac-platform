'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import ExerciseForm from '@/components/exercises/ExerciseForm';
import type { ExerciseDTO } from '@/types';

export default function NewExercisePage() {
  const t = useTranslations('exercises');
  const router = useRouter();

  function handleSuccess(exercise: ExerciseDTO) {
    router.push(`/exercises/${exercise._id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t('post')}
        </h1>
        <div className="mt-8">
          <ExerciseForm onSuccess={handleSuccess} />
        </div>
      </section>
    </main>
  );
}
