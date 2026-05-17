/**
 * Decide which HTML tag the <MathText> wrapper should render as.
 *
 * `<div>` is the only legal container for block math. A caller asking for
 * `<span>` or `<p>` with block-math content would produce invalid nesting
 * (`<div>` inside `<span>`/`<p>`) and a React hydration warning — and, in
 * Safari, observable layout artefacts. So whenever any segment is `block`,
 * the wrapper is forced to `<div>` regardless of the `as` prop.
 *
 * Pure helper — extracted into its own module so it can be unit tested
 * without pulling in react-katex / KaTeX CSS.
 */
import type { MathSegment } from './math-text-splitter';

export function resolveMathTextWrapper(
  segments: MathSegment[],
  requested: 'span' | 'div' | 'p'
): 'span' | 'div' | 'p' {
  return segments.some((s) => s.type === 'block') ? 'div' : requested;
}
