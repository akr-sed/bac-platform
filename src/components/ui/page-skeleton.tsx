import { Skeleton } from './skeleton';

type Variant = 'feed' | 'grid' | 'detail';

interface PageSkeletonProps {
  variant?: Variant;
  count?: number;
}

/**
 * Lightweight placeholder shown by Next.js `loading.tsx` while server
 * components stream. Logical (start/end) sizing keeps it RTL-safe.
 */
export function PageSkeleton({ variant = 'feed', count = 5 }: PageSkeletonProps) {
  const items = Array.from({ length: count });
  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-20" />
      </div>
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : variant === 'detail' ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
