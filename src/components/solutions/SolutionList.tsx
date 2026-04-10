'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import SolutionCard from './SolutionCard';
import SolutionForm from './SolutionForm';
import type { SolutionDTO } from '@/types';

interface SolutionListProps {
  exerciseId: string;
}

export default function SolutionList({ exerciseId }: SolutionListProps) {
  const t = useTranslations('solutions');
  const tCommon = useTranslations('common');
  const { user } = useAuth();

  const [solutions, setSolutions] = useState<SolutionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSolutions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/exercises/${exerciseId}/solutions?page=${page}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setSolutions(data.data);
        setTotalPages(data.totalPages);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [exerciseId, page]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  function handleSolutionCreated() {
    setPage(1);
    fetchSolutions();
  }

  return (
    <div className="space-y-6">
      {user && (
        <SolutionForm
          exerciseId={exerciseId}
          onSuccess={handleSolutionCreated}
        />
      )}

      {loading ? (
        <p className="text-center text-slate-500">{tCommon('loading')}</p>
      ) : solutions.length === 0 ? (
        <p className="text-center text-slate-500">
          {t('view')} — no solutions yet
        </p>
      ) : (
        <div className="space-y-4">
          {solutions.map((solution) => (
            <SolutionCard key={solution._id} solution={solution} />
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                {tCommon('previous')}
              </Button>
              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {tCommon('next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
