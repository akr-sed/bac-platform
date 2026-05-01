'use client';

/**
 * MathText
 *
 * Renders prose that may contain inline (`$...$`) or block (`$$...$$`) math.
 * Math segments are rendered via KaTeX, wrapped in `dir="ltr"` so they
 * survive the surrounding RTL prose intact.
 *
 * Marked `'use client'` because `react-katex`'s `InlineMath` / `BlockMath`
 * use client-only React hooks. Importing the KaTeX stylesheet here (rather
 * than the locale layout) means the ~24 KB of CSS plus 60 font files only
 * ships when a route actually mounts <MathText>, keeping the feed bundle
 * under the 80 KB gzipped guardrail in CLAUDE.md.
 */
import { Fragment } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
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
          <div key={i} dir="ltr" className="my-2 text-center">
            <BlockMath math={seg.value} />
          </div>
        );
      })}
    </As>
  );
}

export default MathText;
