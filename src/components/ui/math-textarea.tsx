'use client';

/**
 * MathTextarea — textarea with a write/preview tab pair that live-renders
 * `$...$` and `$$...$$` math via <MathText>. Used by:
 *  - SubmitSolutionDialog (solutions.compose namespace)
 *  - ExerciseForm           (exercises.compose namespace)
 *  - Anywhere else that needs math-aware authoring.
 *
 * Labels are passed as props instead of pulled from a fixed namespace so
 * each caller can localise within its own translation tree.
 */
import { useState, type TextareaHTMLAttributes } from 'react';
import { MathText } from '@/components/ui/math-text';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface MathTextareaLabels {
  write: string;
  preview: string;
  previewEmpty: string;
  /** Optional one-line hint shown under the toggle, e.g. "Use $...$ for math". */
  mathHint?: string;
}

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (next: string) => void;
  labels: MathTextareaLabels;
  /** Wrapper class applied around the whole control (tabs + textarea/preview). */
  wrapperClassName?: string;
}

export function MathTextarea({
  value,
  onChange,
  labels,
  wrapperClassName,
  className,
  rows = 6,
  placeholder,
  ...textareaProps
}: Props) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <div className={cn('space-y-2', wrapperClassName)}>
      <div
        role="tablist"
        aria-label={labels.write}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'write'}
          onClick={() => setMode('write')}
          className={cn(
            'cursor-pointer rounded-full px-3 py-1 font-medium transition-colors',
            mode === 'write'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {labels.write}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'preview'}
          onClick={() => setMode('preview')}
          className={cn(
            'cursor-pointer rounded-full px-3 py-1 font-medium transition-colors',
            mode === 'preview'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {labels.preview}
        </button>
      </div>

      {mode === 'write' ? (
        <Textarea
          {...textareaProps}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <div className="min-h-[8rem] rounded-2xl border border-border bg-card p-4">
          {value.trim().length > 0 ? (
            <MathText className="text-sm leading-relaxed">{value}</MathText>
          ) : (
            <p className="text-sm italic text-muted-foreground">{labels.previewEmpty}</p>
          )}
        </div>
      )}

      {labels.mathHint && (
        <p className="text-xs text-muted-foreground">{labels.mathHint}</p>
      )}
    </div>
  );
}

export default MathTextarea;
