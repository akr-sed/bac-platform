import { describe, it, expect } from 'vitest';
import { splitMathText } from '../math-text-splitter';

describe('splitMathText', () => {
  it('returns an empty list for empty/nullish input', () => {
    expect(splitMathText('')).toEqual([]);
    expect(splitMathText(null)).toEqual([]);
    expect(splitMathText(undefined)).toEqual([]);
  });

  it('returns a single text segment when no math is present', () => {
    expect(splitMathText('hello world')).toEqual([
      { type: 'text', value: 'hello world' },
    ]);
  });

  it('extracts a single inline math expression', () => {
    expect(splitMathText('value is $x^2$ here')).toEqual([
      { type: 'text', value: 'value is ' },
      { type: 'inline', value: 'x^2' },
      { type: 'text', value: ' here' },
    ]);
  });

  it('extracts a single block math expression', () => {
    expect(splitMathText('before $$\\sum_{i=0}^n i$$ after')).toEqual([
      { type: 'text', value: 'before ' },
      { type: 'block', value: '\\sum_{i=0}^n i' },
      { type: 'text', value: ' after' },
    ]);
  });

  it('handles multiple inline expressions in a row', () => {
    expect(splitMathText('$a$ and $b$ and $c$')).toEqual([
      { type: 'inline', value: 'a' },
      { type: 'text', value: ' and ' },
      { type: 'inline', value: 'b' },
      { type: 'text', value: ' and ' },
      { type: 'inline', value: 'c' },
    ]);
  });

  it('handles mixed inline and block math', () => {
    const input = 'inline $a+b$ then block $$c=d$$ end';
    expect(splitMathText(input)).toEqual([
      { type: 'text', value: 'inline ' },
      { type: 'inline', value: 'a+b' },
      { type: 'text', value: ' then block ' },
      { type: 'block', value: 'c=d' },
      { type: 'text', value: ' end' },
    ]);
  });

  it('preserves Arabic prose surrounding math', () => {
    const input = 'القيمة هي $f(x) = x^2$ في النهاية';
    const result = splitMathText(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', value: 'القيمة هي ' });
    expect(result[1]).toEqual({ type: 'inline', value: 'f(x) = x^2' });
    expect(result[2]).toEqual({ type: 'text', value: ' في النهاية' });
  });

  it('preserves a stray unmatched dollar sign as plain text', () => {
    expect(splitMathText('the price is $5')).toEqual([
      { type: 'text', value: 'the price is $5' },
    ]);
  });

  it('preserves an escaped dollar as a literal in the text segment', () => {
    expect(splitMathText('cost \\$10 is fine')).toEqual([
      { type: 'text', value: 'cost $10 is fine' },
    ]);
  });

  it('treats unmatched $$ as plain text', () => {
    expect(splitMathText('something $$ broken')).toEqual([
      { type: 'text', value: 'something $$ broken' },
    ]);
  });

  it('handles math at the very start and end of the string', () => {
    expect(splitMathText('$x$middle$y$')).toEqual([
      { type: 'inline', value: 'x' },
      { type: 'text', value: 'middle' },
      { type: 'inline', value: 'y' },
    ]);
  });

  it('parses the BAC-2022 style first-exercise statement', () => {
    const input = 'بواقي القسمة الإقليدية للعدد $2^n$ على 7';
    expect(splitMathText(input)).toEqual([
      { type: 'text', value: 'بواقي القسمة الإقليدية للعدد ' },
      { type: 'inline', value: '2^n' },
      { type: 'text', value: ' على 7' },
    ]);
  });
});
