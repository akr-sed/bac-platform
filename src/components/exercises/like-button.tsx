'use client';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  exerciseId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ exerciseId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const wasLiked = liked;
    const wasCount = count;
    const next = !liked;
    setLiked(next);
    setCount(count + (next ? 1 : -1));
    setPending(true);

    try {
      const res = await fetch(`/api/exercises/${exerciseId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.likesCount);
    } catch {
      setLiked(wasLiked);
      setCount(wasCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      aria-pressed={liked}
      className={cn(
        'flex items-center gap-1 rounded-md px-3 py-2 text-sm transition',
        liked ? 'text-red-500' : 'text-muted-foreground hover:bg-muted'
      )}
    >
      <Heart className={cn('size-4', liked && 'fill-current')} />
      {count}
    </button>
  );
}
