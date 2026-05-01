/**
 * Pure splitter that turns a mixed text/math string into a sequence of typed segments.
 *
 * Recognises:
 *   - `$$...$$` for block math
 *   - `$...$` for inline math
 *   - everything else is plain text
 *
 * Unmatched delimiters are preserved as plain text so we never throw on malformed input.
 *
 * Kept pure (no React, no DOM) so it can be unit tested in isolation.
 */

export type MathSegment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string };

export function splitMathText(input: string | null | undefined): MathSegment[] {
  if (!input) return [];

  const segments: MathSegment[] = [];
  let buffer = '';
  let i = 0;

  const flushText = () => {
    if (buffer.length > 0) {
      segments.push({ type: 'text', value: buffer });
      buffer = '';
    }
  };

  while (i < input.length) {
    const ch = input[i];

    // Skip escaped dollars: `\$` is treated as a literal dollar in the text.
    if (ch === '\\' && input[i + 1] === '$') {
      buffer += '$';
      i += 2;
      continue;
    }

    if (ch === '$') {
      // Block math: $$...$$
      if (input[i + 1] === '$') {
        const end = input.indexOf('$$', i + 2);
        if (end === -1) {
          // Unmatched: keep as plain text and stop scanning for math.
          buffer += input.slice(i);
          i = input.length;
          continue;
        }
        flushText();
        segments.push({ type: 'block', value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }

      // Inline math: $...$
      const end = input.indexOf('$', i + 1);
      if (end === -1) {
        buffer += input.slice(i);
        i = input.length;
        continue;
      }
      flushText();
      segments.push({ type: 'inline', value: input.slice(i + 1, end) });
      i = end + 1;
      continue;
    }

    buffer += ch;
    i += 1;
  }

  flushText();
  return segments;
}
