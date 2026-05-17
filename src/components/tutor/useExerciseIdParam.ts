'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * URL-synced exercise selection for the tutor page.
 *
 *   /[locale]/tutor?exerciseId=<id>
 *
 * Single source of truth across the three tabs. Changing the value calls
 * `router.replace` with `scroll: false` so the page doesn't jump when the
 * picker selection updates. Pass `null` to clear the selection.
 */
export function useExerciseIdParam(): {
  exerciseId: string | null;
  setExerciseId: (next: string | null) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const exerciseId = searchParams.get('exerciseId');

  const setExerciseId = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('exerciseId', next);
      else params.delete('exerciseId');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return { exerciseId, setExerciseId };
}
