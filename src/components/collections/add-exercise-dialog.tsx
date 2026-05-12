'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SearchHit {
  _id: string;
  title: string;
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Props {
  collectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyIncludedIds: string[];
  onAdded?: (exerciseId: string) => void;
}

/**
 * Search modal for adding an exercise to a collection. Debounces input to keep
 * the /api/exercises call cheap, and filters out exercises that are already in
 * the collection.
 */
export function AddExerciseDialog({
  collectionId,
  open,
  onOpenChange,
  alreadyIncludedIds,
  onAdded,
}: Props) {
  const t = useTranslations('collections');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const includedSet = new Set(alreadyIncludedIds);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '15' });
        if (query.trim()) params.set('search', query.trim());
        const res = await fetch(`/api/exercises?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data ?? []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const onPick = async (id: string) => {
    setAdding(id);
    try {
      const res = await fetch(`/api/collections/${collectionId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t('form.error'));
        return;
      }
      toast.success(t('addedToCollection'));
      onAdded?.(id);
      onOpenChange(false);
    } catch {
      toast.error(t('form.error'));
    } finally {
      setAdding(null);
    }
  };

  const visible = results.filter((r) => !includedSet.has(r._id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {t('addExercise')}
          </DialogTitle>
          <DialogDescription>{t('search')}</DialogDescription>
        </DialogHeader>

        <div className="relative pt-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="ps-10"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('searchEmpty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((ex) => (
                <li key={ex._id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 rounded-xl p-3 text-start"
                    disabled={adding === ex._id}
                    onClick={() => onPick(ex._id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">
                        {ex.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {[ex.subject, ex.topic, ex.difficulty]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {adding === ex._id && (
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
