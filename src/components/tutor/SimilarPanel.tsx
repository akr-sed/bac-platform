'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Wand2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { subjectBadgeClass } from '@/lib/exercise-badges';
import { cn } from '@/lib/utils';

interface SimilarItem {
  exerciseId: string;
  title: string;
  subject: string;
  reason: string;
}

interface SimilarResponse {
  similar: SimilarItem[];
  __placeholder?: boolean;
}

interface Props {
  exerciseId: string;
}

export function SimilarPanel({ exerciseId }: Props) {
  const t = useTranslations('tutor');
  const [result, setResult] = useState<SimilarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, [exerciseId]);

  async function request() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tutor/similar?exerciseId=${encodeURIComponent(exerciseId)}`
      );
      if (!res.ok) {
        setError(t('errorGeneric'));
        return;
      }
      setResult((await res.json()) as SimilarResponse);
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button
        type="button"
        intent="primary-blue"
        size="sm"
        onClick={request}
        loading={loading}
        disabled={loading}
      >
        {loading ? t('thinking') : t('findSimilar')}
      </Button>

      {error && (
        <p className="text-sm text-[#ED2D30]" role="alert">
          {error}
        </p>
      )}

      {loading && !result && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex h-full flex-col gap-2 rounded-2xl border border-[#D9EFF8] bg-white p-4 shadow-sm"
            >
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-3/4 rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
            </li>
          ))}
        </ul>
      )}

      {result && (
        <div className="space-y-3">
          {result.__placeholder && (
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#0095D1]/40 bg-[#E6F4FA] px-2 py-0.5 text-[11px] font-semibold text-[#00709D]">
                <Sparkles className="size-3" />
                {t('placeholderBadge')}
              </span>
            </div>
          )}
          {result.similar.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#BBC8D4] bg-[#F9FBFD] p-10 text-center">
              <Wand2 className="mx-auto mb-3 size-8 text-[#BBC8D4]" />
              <p className="text-sm font-semibold text-[#003449]">
                {t('noResults')}
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.similar.map((s) => (
                <li key={s.exerciseId}>
                  <Link
                    href={`/exercises/${s.exerciseId}` as '/'}
                    className={cn(
                      'flex h-full flex-col gap-2 rounded-2xl border border-[#D9EFF8] bg-white p-4 shadow-sm transition-all',
                      'hover:-translate-y-0.5 hover:border-[#0095D1] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]',
                      'focus-visible:border-[#0095D1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0095D1]/30'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold capitalize',
                        subjectBadgeClass(s.subject)
                      )}
                    >
                      {s.subject}
                    </span>
                    <h3 className="line-clamp-2 text-base font-bold text-[#003449]">
                      {s.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-[#3E4850]">
                      {s.reason}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
