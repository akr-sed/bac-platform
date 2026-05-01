'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionCard } from './session-card';
import { cn } from '@/lib/utils';
import type { SessionDTO } from '@/types';

interface Props {
  teacherId: string;
}

export function TeacherSessionsSection({ teacherId }: Props) {
  const t = useTranslations('sessions');
  const [items, setItems] = useState<SessionDTO[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions?teacherId=${teacherId}&limit=10`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((data) => {
        if (!cancelled) setItems(data.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  return (
    <section className="mb-8" aria-labelledby="teacher-sessions-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="teacher-sessions-heading"
          className="font-heading text-lg font-semibold"
        >
          {t('mySessions')}
        </h2>
        <Link
          href="/sessions/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'cursor-pointer gap-1.5'
          )}
        >
          <Plus className="size-4" />
          {t('create')}
        </Link>
      </div>
      {items === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {t('noSessions')}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => (
            <SessionCard key={s._id} session={s} />
          ))}
        </div>
      )}
    </section>
  );
}
