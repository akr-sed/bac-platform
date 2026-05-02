import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  showWordmark?: boolean;
}

/**
 * Najah brand mark — wordmark with a subtle bracket motif.
 * The two corners (┐└) reference an exam-paper margin and a checkbox simultaneously.
 */
export function Logo({ className, showWordmark = true }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight',
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-7 shrink-0 text-primary"
        fill="none"
      >
        <path
          d="M6 6 L6 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M6 6 L12 6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M26 26 L26 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M26 26 L20 26"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M10 22 L15 26 L24 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && <span className="font-heading">Najah</span>}
    </span>
  );
}
