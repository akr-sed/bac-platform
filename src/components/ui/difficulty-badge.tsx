import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

const levelStyles: Record<DifficultyLevel, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100',
  hard: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
};

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  label?: string;
  className?: string;
}

export function DifficultyBadge({ level, label, className }: DifficultyBadgeProps) {
  const displayLabel = label ?? level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <Badge
      className={cn(
        'cursor-default border-transparent font-medium text-xs',
        levelStyles[level],
        className
      )}
    >
      {displayLabel}
    </Badge>
  );
}
