import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsPillProps {
  count: number;
  className?: string;
}

export function PointsPill({ count, className }: PointsPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary',
        className
      )}
    >
      <Star className="size-4 fill-primary text-primary" />
      {count.toLocaleString()}
    </span>
  );
}
