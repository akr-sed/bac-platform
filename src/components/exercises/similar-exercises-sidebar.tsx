'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { resolveExerciseTitle } from '@/lib/resolve-exercise-title';

interface SimilarExercise {
  _id: string;
  title: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  source?: 'ai' | 'manual';
}

interface SimilarExercisesSidebarProps {
  exerciseId: string;
}

export function SimilarExercisesSidebar({ exerciseId }: SimilarExercisesSidebarProps) {
  const t = useTranslations('ai');
  const tEx = useTranslations('exercises.detail');
  const locale = useLocale();
  const [items, setItems] = useState<SimilarExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/exercises/${exerciseId}/similar`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems(data.data ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-foreground">
        {tEx('similarExercises')}
      </h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-border p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noSimilar')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item._id} href={`/exercises/${item._id}`}>
              <Card className="cursor-pointer rounded-xl border border-border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                <CardContent className="space-y-2 p-0">
                  <h4 className="line-clamp-2 text-sm font-medium text-foreground">
                    <bdi>{resolveExerciseTitle(item, locale)}</bdi>
                  </h4>
                  <div className="flex items-center gap-2">
                    {item.subject && (
                      <Badge variant="secondary" className="text-xs">
                        {item.subject}
                      </Badge>
                    )}
                    {item.difficulty && (
                      <DifficultyBadge level={item.difficulty} />
                    )}
                  </div>
                  {item.source === 'ai' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ai-accent">
                      <Sparkles className="size-3" />
                      Suggested by AI
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
