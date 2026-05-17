'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import { SessionCard } from './session-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { SessionDTO } from '@/types';

const SUBJECTS = [
  'math',
  'physics',
  'chemistry',
  'biology',
  'arabic-lit',
  'french-lit',
  'philosophy',
  'history',
  'english',
] as const;

interface Props {
  initialSessions: SessionDTO[];
}

export function SessionsList({ initialSessions }: Props) {
  const t = useTranslations('sessions');
  const tSubjects = useTranslations('subjects');
  const [subject, setSubject] = useState<string>('');
  const [sessions, setSessions] = useState<SessionDTO[]>(initialSessions);
  const [loading, setLoading] = useState(false);
  // Track whether the user has interacted with the filter at least once.
  // The first render hydrates from the server-fetched `initialSessions`, so
  // we skip the network round-trip until the user actually changes the
  // filter — including switching back to "All subjects". The previous
  // `if (subject !== '')` guard meant clicking "All" after filtering by
  // math left the user staring at the math-filtered list.
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (!hasInteractedRef.current) return;
    let cancelled = false;
    async function fetchSessions() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          upcoming: 'true',
          limit: '30',
        });
        if (subject) params.set('subject', subject);
        const res = await fetch(`/api/sessions?${params}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSessions(data.data ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSessions();
    return () => {
      cancelled = true;
    };
  }, [subject]);

  function handleSubjectChange(next: string) {
    hasInteractedRef.current = true;
    setSubject(next);
  }

  const chipBase =
    'shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors';
  const chipActive = 'border-primary bg-primary/10 text-primary';
  const chipInactive = 'border-border bg-background text-muted-foreground hover:bg-muted';

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Desktop: vertical filter sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <Card className="p-4">
          <Label className="mb-3 block text-sm font-semibold">
            {t('filters.subject')}
          </Label>
          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <input
                type="radio"
                name="subject"
                value=""
                checked={subject === ''}
                onChange={() => handleSubjectChange('')}
                className="accent-[var(--primary)]"
              />
              <span>{t('filters.all')}</span>
            </label>
            {SUBJECTS.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <input
                  type="radio"
                  name="subject"
                  value={s}
                  checked={subject === s}
                  onChange={() => handleSubjectChange(s)}
                  className="accent-[var(--primary)]"
                />
                <span>{tSubjects(s)}</span>
              </label>
            ))}
          </div>
        </Card>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile: horizontal scroll chip row */}
        <div
          role="radiogroup"
          aria-label={t('filters.subject')}
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
        >
          <button
            type="button"
            role="radio"
            aria-checked={subject === ''}
            onClick={() => handleSubjectChange('')}
            className={cn(chipBase, subject === '' ? chipActive : chipInactive)}
          >
            {t('filters.all')}
          </button>
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={subject === s}
              onClick={() => handleSubjectChange(s)}
              className={cn(chipBase, subject === s ? chipActive : chipInactive)}
            >
              {tSubjects(s)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="flex flex-col items-center p-12 text-center">
            <Calendar className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-lg font-semibold">{t('noSessions')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('noSessionsHint')}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sessions.map((s) => (
              <SessionCard key={s._id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
