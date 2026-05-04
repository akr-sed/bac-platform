import { cn } from '@/lib/utils';

export interface DashedDividerProps {
  direction?: 'horizontal' | 'vertical';
  intent?: 'accent' | 'navy';
  className?: string;
}

export function DashedDivider({ direction = 'horizontal', intent = 'accent', className }: DashedDividerProps) {
  const colorClass = intent === 'accent' ? 'border-[--accent]' : 'border-[--foreground-deep,#003449]';
  const dirClass = direction === 'horizontal' ? 'w-full border-t-2 border-dashed' : 'h-full border-s-2 border-dashed';

  return <div className={cn(dirClass, colorClass, className)} role="separator" aria-orientation={direction} />;
}

export default DashedDivider;
