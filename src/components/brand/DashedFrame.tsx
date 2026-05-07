import { cn } from '@/lib/utils';

export interface DashedFrameProps {
  children: React.ReactNode;
  intent?: 'accent' | 'navy';
  className?: string;
}

const INTENT_CLASS = {
  accent: 'border-[--accent]',
  navy: 'border-[--foreground-deep,#003449]',
};

export function DashedFrame({ children, intent = 'accent', className }: DashedFrameProps) {
  return (
    <div
      className={cn(
        'inline-block border-2 border-dashed rounded-md px-4 py-2',
        INTENT_CLASS[intent],
        className,
      )}
    >
      {children}
    </div>
  );
}

export default DashedFrame;
