'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, FileText } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { FeedItemDTO } from '@/types';

interface Props {
  initialItems: FeedItemDTO[];
  pageSize?: number;
}

interface FeedResponse {
  data?: FeedItemDTO[];
  hasMore?: boolean;
}

/**
 * Teacher-specific feed list. Simplified mirror of `feed-list.tsx`:
 *   - Always `sort=latest`, always `authorRole=student`.
 *   - No tabs, no Following filter, no URL-driven state — this page exists
 *     solely to surface recent student questions to the teacher.
 *   - Each card is rendered with an extra teacher-CTA strip beneath it
 *     ("Add detailed solution", "View student's answer"). We render the
 *     strip OUTSIDE the card so `<ExerciseCard>` stays a shared primitive.
 */
export function TeacherFeedList({ initialItems, pageSize = 10 }: Props) {
  const t = useTranslations('teacher');
  const tFeed = useTranslations('feed');

  const [items, setItems] = useState<FeedItemDTO[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Infinite-scroll sentinel — fires when the bottom of the list enters the
  // viewport (+400px rootMargin to prefetch one screen ahead).
  useEffect(() => {
    if (!sentinel.current) return;
    const el = sentinel.current;
    const obs = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || !hasMore) return;
        setLoading(true);
        try {
          const res = await fetch(
            `/api/feed?page=${page}&limit=${pageSize}&sort=latest&authorRole=student`
          );
          const data = (await res.json()) as FeedResponse;
          setItems((prev) => [...prev, ...(data.data ?? [])]);
          setPage((p) => p + 1);
          setHasMore(Boolean(data.hasMore));
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading, hasMore, pageSize]);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">—</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((it) => (
        <div key={it._id} className="space-y-2">
          <ExerciseCard exercise={it} />
          {/* Teacher-only CTA strip — rendered outside the card so the
              shared <ExerciseCard> primitive doesn't fork for teachers. */}
          <div
            className={cn(
              'flex flex-wrap items-center gap-2 px-1',
              'text-sm font-semibold'
            )}
          >
            <Link
              href={`/exercises/${it._id}?openSolutionDialog=true`}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#0095D1] px-3 text-white transition-colors hover:bg-[#007FB3]"
            >
              <FileText className="size-3.5" aria-hidden="true" />
              <span>{t('cards.addDetailedSolution')}</span>
            </Link>
            <Link
              href={`/exercises/${it._id}#solutions`}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#0095D1] bg-transparent px-3 text-[#0095D1] transition-colors hover:bg-[#D9EFF8]"
            >
              <span>{t('cards.viewStudentAnswer')}</span>
              <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ))}
      <div ref={sentinel} className="h-10" aria-hidden />
      {loading && (
        <div aria-busy="true" className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
          <p className="text-center text-sm text-muted-foreground">
            {tFeed('loading')}
          </p>
        </div>
      )}
    </div>
  );
}

export default TeacherFeedList;
