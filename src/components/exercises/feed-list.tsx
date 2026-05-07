'use client';
import { useEffect, useRef, useState } from 'react';
import { ExerciseCard } from './exercise-card';
import type { FeedItemDTO } from '@/types';

interface Props {
  initialItems: FeedItemDTO[];
  endpoint: string;
}

export function FeedList({ initialItems, endpoint }: Props) {
  const [items, setItems] = useState<FeedItemDTO[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialItems.length > 0);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinel.current) return;
    const el = sentinel.current;
    const obs = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || !hasMore) return;
        setLoading(true);
        try {
          const res = await fetch(`${endpoint}?page=${page}&limit=10`);
          const data = await res.json();
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
  }, [page, loading, hasMore, endpoint]);

  return (
    <div className="space-y-4">
      {items.map((it) => (
        <ExerciseCard key={it._id} exercise={it} />
      ))}
      <div ref={sentinel} className="h-10" aria-hidden />
      {loading && (
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      )}
    </div>
  );
}
