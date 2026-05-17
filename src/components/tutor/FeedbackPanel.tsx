'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { MathTextInline } from '@/components/ui/math-text';

interface FeedbackComment {
  line: number;
  text: string;
}

interface FeedbackResponse {
  score: number;
  comments: FeedbackComment[];
  summary: string;
  __placeholder?: boolean;
}

interface Props {
  exerciseId: string;
}

export function FeedbackPanel({ exerciseId }: Props) {
  const t = useTranslations('tutor');
  const [attempt, setAttempt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state whenever the exercise changes.
  useEffect(() => {
    setAttempt('');
    setImages([]);
    setResult(null);
    setError(null);
    setLoading(false);
  }, [exerciseId]);

  async function request() {
    if (!attempt.trim()) {
      setError(t('attemptRequired'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tutor/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ exerciseId, attempt, images }),
      });
      if (!res.ok) {
        setError(t('errorGeneric'));
        return;
      }
      setResult((await res.json()) as FeedbackResponse);
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  const scorePct = useMemo(
    () => (result ? Math.round(result.score * 100) : null),
    [result]
  );
  // Color rule for the score block: green ≥ 80, amber 50–79, red < 50.
  const scoreClass = useMemo(() => {
    if (scorePct === null) return '';
    if (scorePct >= 80) return 'text-[#166534]';
    if (scorePct >= 50) return 'text-[#92400E]';
    return 'text-[#991B1B]';
  }, [scorePct]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="tutor-attempt" className="text-[#003449]">
          {t('attempt')}
        </Label>
        <Textarea
          id="tutor-attempt"
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          placeholder={t('placeholderAttempt')}
          rows={6}
        />
        <p className="text-xs text-[#6B7280]">{t('attemptHint')}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-[#003449]">{t('attachImages')}</Label>
        <FileUploadZone
          accept="image/*"
          maxFiles={5}
          value={images}
          onChange={setImages}
          label={t('attachImages')}
        />
      </div>

      <Button
        type="button"
        intent="primary-blue"
        size="sm"
        onClick={request}
        loading={loading}
        disabled={loading}
      >
        {loading ? t('thinking') : t('submitForFeedback')}
      </Button>

      {error && (
        <p className="text-sm text-[#ED2D30]" role="alert">
          {error}
        </p>
      )}

      {loading && !result && (
        <div className="space-y-4 rounded-2xl border border-[#D9EFF8] bg-white p-5 shadow-sm">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-3 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-5/6 rounded-xl" />
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-5 rounded-2xl border border-[#D9EFF8] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#00709D]">
                {t('score')}
              </p>
              <p className={`text-3xl font-bold tabular-nums ${scoreClass}`}>
                {scorePct}
                <span className="ms-1 text-base font-semibold text-[#3E4850]">
                  / 100
                </span>
              </p>
            </div>
            {result.__placeholder && (
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#0095D1]/40 bg-[#E6F4FA] px-2 py-0.5 text-[11px] font-semibold text-[#00709D]">
                <Sparkles className="size-3" />
                {t('placeholderBadge')}
              </span>
            )}
          </div>

          {result.comments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#00709D]">
                {t('lineComments')}
              </p>
              <ul className="space-y-2">
                {result.comments.map((c) => (
                  <li
                    key={`${c.line}-${c.text}`}
                    className="flex gap-3 rounded-xl bg-[#F9FBFD] p-3 text-sm text-[#003449] ring-1 ring-[#D9EFF8]"
                  >
                    <span className="shrink-0 rounded-full bg-[#E6F4FA] px-2 py-0.5 text-xs font-bold text-[#00709D]">
                      {t('lineLabel', { line: c.line })}
                    </span>
                    <MathTextInline className="block leading-6">
                      {c.text}
                    </MathTextInline>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide text-[#00709D]">
              {t('summary')}
            </p>
            <MathTextInline className="block text-base leading-7 text-[#003449]">
              {result.summary}
            </MathTextInline>
          </div>
        </div>
      )}
    </div>
  );
}
