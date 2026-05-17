'use client';

import { useTranslations } from 'next-intl';
import { OwlIllustration } from '@/components/brand/OwlIllustration';

/**
 * Legacy props kept so the 12 existing `loading.tsx` files don't need edits.
 * They are intentionally ignored — the component now renders a single animated
 * owl + localized caption regardless of variant/count.
 */
interface PageSkeletonProps {
  variant?: 'feed' | 'grid' | 'detail';
  count?: number;
}

/**
 * Page-level loading placeholder shown by Next.js `loading.tsx` while server
 * components stream. Renders the NAJAH owl with a gentle bob + blink animation
 * and a localized "Loading…" caption. Respects `prefers-reduced-motion`.
 */
export function PageSkeleton(_props: PageSkeletonProps = {}) {
  const t = useTranslations('common');
  return (
    <div
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-[var(--space-sm)] px-4 py-[var(--space-lg)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OwlIllustration variant="loading" size={128} animate />
      <p className="text-sm text-muted-foreground">{t('loading')}</p>
    </div>
  );
}

export default PageSkeleton;
