/**
 * MathText
 *
 * Renders prose that may contain inline (`$...$`) or block (`$$...$$`) math.
 * Math segments are rendered via KaTeX (already loaded globally), wrapped in
 * `dir="ltr"` so they survive the surrounding RTL prose intact.
 *
 * SSR-safe — `react-katex` and `katex` both run on the server.
 *
 * The KaTeX stylesheet must be imported once globally (see globals.css).
 */
import { Fragment } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { splitMathText } from '@/lib/math-text-splitter';
import { cn } from '@/lib/utils';

export interface MathTextProps {
  /** Raw text containing optional `$...$` and `$$...$$` math segments. */
  children: string | null | undefined;
  /** Optional wrapper class. */
  className?: string;
  /** Render the wrapper as a <div> instead of <span>. Use when the math contains block expressions. */
  as?: 'span' | 'div' | 'p';
}

export function MathText({ children, className, as: As = 'div' }: MathTextProps) {
  if (!children) return null;

  const segments = splitMathText(children);

  return (
    <As className={cn('whitespace-pre-wrap', className)}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <Fragment key={i}>{seg.value}</Fragment>;
        }

        if (seg.type === 'inline') {
          return (
            <span key={i} dir="ltr" className="inline-block align-baseline">
              <InlineMath math={seg.value} />
            </span>
          );
        }

        // block
        return (
          <span key={i} dir="ltr" className="my-2 block text-center">
            <BlockMath math={seg.value} />
          </span>
        );
      })}
    </As>
  );
}

export default MathText;
