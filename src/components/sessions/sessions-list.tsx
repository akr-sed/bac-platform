'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import { SessionCard } from './session-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

  useEffect(() => {
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
    if (subject !== '') fetchSessions();
    return () => {
      cancelled = true;
    };
  }, [subject]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-64 lg:shrink-0">
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
                onChange={() => setSubject('')}
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
                  onChange={() => setSubject(s)}
                  className="accent-[var(--primary)]"
                />
                <span>{tSubjects(s)}</span>
              </label>
            ))}
          </div>
        </Card>
      </aside>

      <div className="flex-1">
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
