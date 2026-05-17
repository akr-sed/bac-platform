import { describe, it, expect } from 'vitest';
import { resolveMathTextWrapper } from '../math-text-wrapper';
import { splitMathText } from '../math-text-splitter';

describe('resolveMathTextWrapper', () => {
  it('respects the requested wrapper when there is no block math', () => {
    expect(resolveMathTextWrapper(splitMathText('plain text'), 'span')).toBe('span');
    expect(resolveMathTextWrapper(splitMathText('plain text'), 'div')).toBe('div');
    expect(resolveMathTextWrapper(splitMathText('plain text'), 'p')).toBe('p');
  });

  it('respects the requested wrapper when only inline math is present', () => {
    const segments = splitMathText('compute $x = 1$ then continue');
    expect(resolveMathTextWrapper(segments, 'span')).toBe('span');
    expect(resolveMathTextWrapper(segments, 'p')).toBe('p');
  });

  it('promotes the wrapper to <div> when block math is present even if span was requested', () => {
    const segments = splitMathText('see $$x = 1$$ above');
    expect(resolveMathTextWrapper(segments, 'span')).toBe('div');
  });

  it('promotes the wrapper to <div> when block math is present even if p was requested', () => {
    const segments = splitMathText('intro $$\\sum_{i=0}^{n} i$$ outro');
    expect(resolveMathTextWrapper(segments, 'p')).toBe('div');
  });

  it('keeps <div> as <div> for block math', () => {
    const segments = splitMathText('$$x^2 + y^2 = z^2$$');
    expect(resolveMathTextWrapper(segments, 'div')).toBe('div');
  });

  it('promotes when a block segment lives between text segments', () => {
    const segments = splitMathText('a $$b$$ c');
    expect(segments.some((s) => s.type === 'block')).toBe(true);
    expect(resolveMathTextWrapper(segments, 'span')).toBe('div');
  });
});
