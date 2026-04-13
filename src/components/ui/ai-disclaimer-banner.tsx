import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIDisclaimerBannerProps {
  message: string;
  className?: string;
}

export function AIDisclaimerBanner({ message, className }: AIDisclaimerBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-xl border border-ai-accent/30 bg-ai-accent/10 p-4',
        className
      )}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-ai-accent" />
      <div className="text-sm">
        <span className="font-semibold text-ai-accent">Experimental</span>
        <span className="ms-1 text-foreground/80">{message}</span>
      </div>
    </div>
  );
}
