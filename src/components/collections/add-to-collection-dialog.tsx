'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Globe2, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OwnedCollection {
  _id: string;
  title: string;
  visibility: 'public' | 'private';
  exerciseIds: string[];
  exerciseCount: number;
}

interface Props {
  exerciseId: string;
  ownerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Surface used on the exercise detail page (teacher / admin only). Lists the
 * viewer's own collections so they can pin the current exercise into one with
 * a single click. Hides collections that already contain the exercise.
 */
export function AddToCollectionDialog({
  exerciseId,
  ownerId,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations('collections');
  const [items, setItems] = useState<OwnedCollection[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setItems(null);
    (async () => {
      try {
        const res = await fetch(`/api/collections?owner=${ownerId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setItems(data.data ?? []);
        } else {
          if (!cancelled) setItems([]);
        }
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, ownerId]);

  const onPick = async (collectionId: string) => {
    setAdding(collectionId);
    try {
      const res = await fetch(`/api/collections/${collectionId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t('form.error'));
        return;
      }
      toast.success(t('addedToCollection'));
      onOpenChange(false);
    } catch {
      toast.error(t('form.error'));
    } finally {
      setAdding(null);
    }
  };

  const visible = (items ?? []).filter(
    (c) => !c.exerciseIds.includes(exerciseId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {t('addToCollection')}
          </DialogTitle>
          <DialogDescription>{t('myCollections')}</DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto pt-2">
          {items === null ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('addToCollectionEmpty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((c) => (
                <li key={c._id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-between gap-3 rounded-xl p-3 text-start"
                    disabled={adding === c._id}
                    onClick={() => onPick(c._id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {c.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t('exerciseCount', { count: c.exerciseCount })}
                      </span>
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        c.visibility === 'public'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.visibility === 'public' ? (
                        <Globe2 className="size-3" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                      {t(`visibility.${c.visibility}`)}
                    </span>
                    {adding === c._id && (
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
