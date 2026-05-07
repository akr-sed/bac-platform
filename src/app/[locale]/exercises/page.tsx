'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Search,
  SlidersHorizontal,
  BookOpen,
  Plus,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { UpcomingSessionsRailClient } from '@/components/sessions/upcoming-sessions-rail-client';
import { cn } from '@/lib/utils';
import type { FeedItemDTO } from '@/types';

interface Exercise {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  author?: {
    _id?: string;
    name: string;
    avatar?: string | null;
    role?: 'student' | 'teacher' | 'admin';
    isVerifiedTeacher?: boolean;
  };
  attachments?: string[];
  solutionCount?: number;
  likesCount?: number;
  commentsCount?: number;
  lastActivityAt?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt?: string;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

function FilterSidebar({
  selectedDifficulty,
  setSelectedDifficulty,
}: {
  selectedDifficulty: string;
  setSelectedDifficulty: (d: string) => void;
}) {
  const t = useTranslations('exercises');

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block text-sm font-semibold text-foreground">
          {t('filter.subject')}
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('filter.subject')} className="ps-10" />
        </div>
      </div>

      <div>
        <Label className="mb-3 block text-sm font-semibold text-foreground">
          {t('filter.topic')}
        </Label>
        <Input placeholder={t('filter.topic')} />
      </div>

      <div>
        <Label className="mb-3 block text-sm font-semibold text-foreground">
          {t('filter.difficulty')}
        </Label>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="difficulty"
              value=""
              checked={selectedDifficulty === ''}
              onChange={() => setSelectedDifficulty('')}
              className="accent-[var(--primary)]"
            />
            <span className="text-sm">{t('filter.all')}</span>
          </label>
          {DIFFICULTIES.map((d) => (
            <label key={d} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="difficulty"
                value={d}
                checked={selectedDifficulty === d}
                onChange={() => setSelectedDifficulty(d)}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm">{t(`difficulty.${d}`)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExercisesPage() {
  const t = useTranslations('exercises');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: '9',
          source: 'community',
        });
        if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
        if (searchQuery) params.set('search', searchQuery);

        const res = await fetch(`/api/exercises?${params}`);
        if (res.ok) {
          const data = await res.json();
          setExercises(data.data ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        /* API not available yet */
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [currentPage, selectedDifficulty, searchQuery]);

  return (
    <AppShell>
    <div className="py-8">
      <UpcomingSessionsRailClient />

      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            {t('browse')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('title')}
          </p>
        </div>
        <Link
          href="/exercises/new"
          className={cn(buttonVariants(), 'cursor-pointer gap-2 rounded-xl')}
        >
          <Plus className="size-4" />
          {t('post')}
        </Link>
      </div>

      {/* Search bar + mobile filter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('filter.subject')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="cursor-pointer" />}
            >
              <SlidersHorizontal className="size-4" />
              <span className="sr-only">Filters</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-6">
              <h2 className="mb-6 font-heading text-lg font-semibold text-foreground">Filters</h2>
              <FilterSidebar
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-70 shrink-0 lg:block">
          <Card className="sticky top-20 rounded-xl border border-border p-6 shadow-sm">
            <FilterSidebar
              selectedDifficulty={selectedDifficulty}
              setSelectedDifficulty={setSelectedDifficulty}
            />
          </Card>
        </aside>

        {/* Exercise grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-xl border border-border p-6">
                  <Skeleton className="mb-3 h-5 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </Card>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <Card className="flex flex-col items-center rounded-xl border border-border p-12 text-center shadow-sm">
              <BookOpen className="mb-4 size-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-foreground">{t('noResults')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or post an exercise.
              </p>
              <Link
                href="/exercises/new"
                className={cn(buttonVariants(), 'mt-6 cursor-pointer gap-2 rounded-xl')}
              >
                <Plus className="size-4" />
                {t('post')}
              </Link>
            </Card>
          ) : (
            <>
              <div className="mx-auto max-w-2xl space-y-4">
                {exercises.map((ex) => (
                  <ExerciseCard
                    key={ex._id}
                    exercise={ex as unknown as FeedItemDTO}
                  />
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
