'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const SUBJECTS = [
  'math', 'physics', 'chemistry', 'biology',
  'arabic-lit', 'french-lit', 'philosophy', 'history', 'english'
] as const;

interface Props {
  initial: string[];
  onSave: (subjects: string[]) => Promise<void>;
}

export function SubjectPicker({ initial, onSave }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set(initial));
  const [saving, setSaving] = useState(false);

  function toggle(s: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try { await onSave([...picked]); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition',
              picked.has(s)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted'
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  );
}
