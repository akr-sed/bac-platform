'use client';
import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  exerciseId: string;
  initialSaved: boolean;
}

export function SaveButton({ exerciseId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const wasSaved = saved;
    const next = !saved;
    setSaved(next);
    setPending(true);

    try {
      const res = next
        ? await fetch('/api/saves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exerciseId }),
          })
        : await fetch(`/api/saves/${exerciseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setSaved(wasSaved);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        'flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 py-2 text-sm transition',
        saved ? 'text-primary' : 'text-muted-foreground hover:bg-muted'
      )}
    >
      <Bookmark className={cn('size-4', saved && 'fill-current')} />
    </button>
  );
}
