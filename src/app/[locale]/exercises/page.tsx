'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import ExerciseFilters from '@/components/exercises/ExerciseFilters';
import type { ExerciseDTO, PaginatedResponse } from '@/types';

export default function ExercisesPage() {
  const t = useTranslations('exercises');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<ExerciseDTO> | null>(null);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const subject = searchParams.get('subject') || '';
  const topic = searchParams.get('topic') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (subject) params.set('subject', subject);
      if (topic) params.set('topic', topic);
      if (difficulty) params.set('difficulty', difficulty);

      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, subject, topic, difficulty]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  function buildPageUrl(newPage: number) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (subject) params.set('subject', subject);
    if (topic) params.set('topic', topic);
    if (difficulty) params.set('difficulty', difficulty);
    params.set('page', String(newPage));
    return `/exercises?${params.toString()}`;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t('browse')}
        </h1>
        {user && (
          <Link href="/exercises/new">
            <Button>{t('post')}</Button>
          </Link>
        )}
      </div>

      <div className="mt-8">
        <ExerciseFilters
          search={search}
          subject={subject}
          topic={topic}
          difficulty={difficulty}
        />
      </div>

      {loading ? (
        <p className="mt-12 text-center text-slate-500">{tCommon('loading')}</p>
      ) : !data || data.data.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">{t('noResults')}</p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((exercise) => (
              <ExerciseCard key={exercise._id} exercise={exercise} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              {page > 1 && (
                <Link href={buildPageUrl(page - 1)}>
                  <Button variant="outline">{tCommon('previous')}</Button>
                </Link>
              )}
              <span className="text-sm text-slate-600">
                {page} / {data.totalPages}
              </span>
              {page < data.totalPages && (
                <Link href={buildPageUrl(page + 1)}>
                  <Button variant="outline">{tCommon('next')}</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
