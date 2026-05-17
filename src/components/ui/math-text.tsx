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
import { splitMathText, type MathSegment } from '@/lib/math-text-splitter';
import { resolveMathTextWrapper } from '@/lib/math-text-wrapper';
import { cn } from '@/lib/utils';

export interface MathTextProps {
  /** Raw text containing optional `$...$` and `$$...$$` math segments. */
  children: string | null | undefined;
  /** Optional wrapper class. */
  className?: string;
  /**
   * Render the wrapper as a `<div>` (default), `<p>`, or `<span>`.
   *
   * If the input contains any `$$...$$` block math, the wrapper is
   * automatically promoted to `<div>` regardless of this prop — `<div>`
   * cannot legally live inside `<span>` or `<p>` and would otherwise
   * trigger React hydration warnings (and, in some browsers, layout bugs).
   */
  as?: 'span' | 'div' | 'p';
}

/**
 * Inline-only variant for callers that know their content has no block math
 * (e.g. a comment row, a card subtitle). Forces the wrapper to `<span>` and
 * promotes any encountered block math to inline `\displaystyle` math so the
 * span never wraps a `<div>`.
 */
export function MathTextInline({
  children,
  className,
}: Omit<MathTextProps, 'as'>) {
  if (!children) return null;
  const segments = splitMathText(children);
  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {segments.map((seg, i) => renderInlineSafe(seg, i))}
    </span>
  );
}

function renderInlineSafe(seg: MathSegment, i: number) {
  if (seg.type === 'text') {
    return <Fragment key={i}>{seg.value}</Fragment>;
  }
  // Both inline and block render as inline math here. Block math gets the
  // KaTeX `\displaystyle` prefix so big operators (sums, integrals, fracs)
  // stay readable.
  const expr = seg.type === 'block' ? `\\displaystyle ${seg.value}` : seg.value;
  return (
    <span key={i} dir="ltr" className="inline-block align-baseline">
      <InlineMath math={expr} />
    </span>
  );
}

export function MathText({ children, className, as: As = 'div' }: MathTextProps) {
  if (!children) return null;

  const segments = splitMathText(children);
  const Wrapper = resolveMathTextWrapper(segments, As);

  return (
    <Wrapper className={cn('whitespace-pre-wrap', className)}>
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

        // Block math gets generous breathing room so RTL Arabic prose and
        // LTR equations stay visually separated, plus horizontal scroll for
        // equations wider than the column.
        return (
          <div
            key={i}
            dir="ltr"
            className="my-4 mx-auto max-w-full overflow-x-auto text-center"
          >
            <BlockMath math={seg.value} />
          </div>
        );
      })}
    </Wrapper>
  );
}

export default MathText;
