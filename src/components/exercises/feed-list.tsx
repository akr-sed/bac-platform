'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ExerciseCard } from './exercise-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { parseFeedSort, type FeedSort } from '@/lib/feed-ranking';
import type { FeedItemDTO } from '@/types';

interface Props {
  initialItems: FeedItemDTO[];
  endpoint: string;
  /**
   * Sort mode the initial server render was generated with. The tab strip
   * stays in sync with this value and the `?sort=` URL search-param.
   */
  initialSort?: FeedSort;
  pageSize?: number;
}

interface FeedResponse {
  data?: FeedItemDTO[];
  hasMore?: boolean;
  sort?: FeedSort;
}

const TAB_VALUES: readonly FeedSort[] = ['for-you', 'trending', 'latest'] as const;

export function FeedList({
  initialItems,
  endpoint,
  initialSort = 'for-you',
  pageSize = 10,
}: Props) {
  const t = useTranslations('feed');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The currently active sort is derived from the URL search params so that
  // back/forward and refresh round-trips stay consistent. `parseFeedSort`
  // already falls back to "for-you" when the param is missing/invalid; we
  // only override that fallback when the page's server-rendered initial sort
  // disagrees AND the URL is unset (so SSR ↔ CSR stay in sync).
  const rawSortParam = searchParams.get('sort');
  const activeSort: FeedSort = rawSortParam
    ? parseFeedSort(rawSortParam)
    : initialSort;

  const [items, setItems] = useState<FeedItemDTO[]>(initialItems);
  // Page index for cursor-style pagination matches the existing API which
  // uses `page * limit` offsets.
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);
  const [loading, setLoading] = useState(false);
  // `refetching` covers the brief window where the active tab changes and we
  // wait for the server to return the first page of the new sort mode.
  const [refetching, setRefetching] = useState(false);
  const [, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);

  // Refetch the feed whenever the tab (and therefore the `sort` query) changes.
  useEffect(() => {
    let cancelled = false;
    // Skip the very first run when the URL sort already matches what the
    // server pre-rendered. That avoids a redundant fetch on initial mount.
    if (activeSort === initialSort && page === 1 && items === initialItems) {
      return;
    }
    setRefetching(true);
    const url = `${endpoint}?page=0&limit=${pageSize}&sort=${activeSort}`;
    fetch(url)
      .then((res) => res.json() as Promise<FeedResponse>)
      .then((data) => {
        if (cancelled) return;
        setItems(data.data ?? []);
        setPage(1);
        setHasMore(Boolean(data.hasMore));
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setRefetching(false);
      });
    return () => {
      cancelled = true;
    };
    // We intentionally exclude `initialItems`/`initialSort`/`items` from the
    // dependency list — those only seed the first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSort, endpoint, pageSize]);

  // Infinite scroll for the active sort mode.
  useEffect(() => {
    if (!sentinel.current) return;
    const el = sentinel.current;
    const obs = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || refetching || !hasMore) return;
        setLoading(true);
        try {
          const res = await fetch(
            `${endpoint}?page=${page}&limit=${pageSize}&sort=${activeSort}`
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
  }, [page, loading, refetching, hasMore, endpoint, pageSize, activeSort]);

  const handleSortChange = (next: FeedSort) => {
    // Persist the selection in the URL so refresh / share preserves it.
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'for-you') {
      params.delete('sort');
    } else {
      params.set('sort', next);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="space-y-5">
      <Tabs
        value={activeSort}
        onValueChange={(v) => {
          // Base UI tabs forward whatever `value` was set on the trigger;
          // ours are always one of FeedSort.
          handleSortChange(v as FeedSort);
        }}
      >
        <TabsList>
          {TAB_VALUES.map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="cursor-pointer px-3"
            >
              {value === 'for-you'
                ? t('tabs.forYou')
                : value === 'trending'
                  ? t('tabs.trending')
                  : t('tabs.latest')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {refetching ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">—</p>
        </div>
      ) : (
        <>
          {items.map((it) => (
            <ExerciseCard key={it._id} exercise={it} />
          ))}
          <div ref={sentinel} className="h-10" aria-hidden />
          {loading && (
            <p className="text-center text-sm text-muted-foreground">
              {t('loading')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}
