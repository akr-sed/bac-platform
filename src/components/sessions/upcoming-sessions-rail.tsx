'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ChevronLeft } from 'lucide-react';
import { SessionCard } from './session-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SessionDTO } from '@/types';

export function UpcomingSessionsRail() {
  const t = useTranslations('sessions');
  const [items, setItems] = useState<SessionDTO[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sessions?upcoming=true&limit=5', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((data) => {
        if (!cancelled) setItems(data.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null;

  if (items === null) {
    return (
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">{t('upcoming')}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="upcoming-sessions-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="upcoming-sessions-heading"
          className="font-heading text-lg font-semibold"
        >
          {t('upcoming')}
        </h2>
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t('browse')}
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Link>
      </div>
      <div
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
        role="list"
      >
        {items.map((s) => (
          <div role="listitem" key={s._id}>
            <SessionCard session={s} variant="rail" />
          </div>
        ))}
      </div>
    </section>
  );
}
