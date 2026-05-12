'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { ExerciseCard } from './exercise-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  parseFeedFilter,
  parseFeedSort,
  type FeedFilter,
  type FeedSort,
} from '@/lib/feed-ranking';
import { cn } from '@/lib/utils';
import type { FeedItemDTO } from '@/types';

interface Props {
  initialItems: FeedItemDTO[];
  endpoint: string;
  /**
   * Sort mode the initial server render was generated with. The tab strip
   * stays in sync with this value and the `?sort=` URL search-param.
   */
  initialSort?: FeedSort;
  /**
   * Filter mode the initial server render was generated with ("all" or
   * "following"). Wave C1.
   */
  initialFilter?: FeedFilter;
  pageSize?: number;
}

interface FeedResponse {
  data?: FeedItemDTO[];
  hasMore?: boolean;
  sort?: FeedSort;
  filter?: FeedFilter;
}

const TAB_VALUES: readonly FeedSort[] = ['for-you', 'trending', 'latest'] as const;

export function FeedList({
  initialItems,
  endpoint,
  initialSort = 'for-you',
  initialFilter = 'all',
  pageSize = 10,
}: Props) {
  const t = useTranslations('feed');
  const tProfile = useTranslations('profile');
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
  const rawFilterParam = searchParams.get('filter');
  const activeFilter: FeedFilter = rawFilterParam
    ? parseFeedFilter(rawFilterParam)
    : initialFilter;

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

  // Refetch the feed whenever the tab (and therefore the `sort` or `filter`
  // query) changes.
  useEffect(() => {
    let cancelled = false;
    // Skip the very first run when the URL sort/filter already matches what
    // the server pre-rendered. That avoids a redundant fetch on initial mount.
    if (
      activeSort === initialSort &&
      activeFilter === initialFilter &&
      page === 1 &&
      items === initialItems
    ) {
      return;
    }
    setRefetching(true);
    const url = `${endpoint}?page=0&limit=${pageSize}&sort=${activeSort}&filter=${activeFilter}`;
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
    // We intentionally exclude `initialItems`/`initialSort`/`initialFilter`/`items` from the
    // dependency list — those only seed the first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSort, activeFilter, endpoint, pageSize]);

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
            `${endpoint}?page=${page}&limit=${pageSize}&sort=${activeSort}&filter=${activeFilter}`
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
  }, [page, loading, refetching, hasMore, endpoint, pageSize, activeSort, activeFilter]);

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

  const handleFilterToggle = () => {
    // Toggle following ⇄ all. Drops the param entirely when "all" so the URL
    // stays clean on the default view.
    const params = new URLSearchParams(searchParams.toString());
    if (activeFilter === 'following') {
      params.delete('filter');
    } else {
      params.set('filter', 'following');
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
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
        <button
          type="button"
          role="switch"
          aria-checked={activeFilter === 'following'}
          aria-label={tProfile('following')}
          onClick={handleFilterToggle}
          className={cn(
            'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
            activeFilter === 'following'
              ? 'border-[#0095D1] bg-[#D9EFF8] text-[#0095D1]'
              : 'border-border bg-card text-muted-foreground hover:bg-accent'
          )}
        >
          <Users className="size-3.5" />
          <span>{tProfile('following')}</span>
        </button>
      </div>

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
