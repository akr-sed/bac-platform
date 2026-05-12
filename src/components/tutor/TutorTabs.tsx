'use client';

// Wave D — AI Tutor SCAFFOLD UI.
//
// Three-tab client island used by /[locale]/tutor/page.tsx. All API calls hit
// the placeholder endpoints under /api/tutor/* so the UI can be built and
// verified end-to-end before any LLM is plugged in. Replace the network
// handlers later when real endpoints land — the response shapes are stable.

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2, Lightbulb, MessageSquare, Wand2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { cn } from '@/lib/utils';

interface ExerciseOption {
  _id: string;
  title: string;
  subject: string;
}

interface HintResponse {
  hint: string;
  level: number;
  exhausted: boolean;
  __placeholder?: boolean;
}

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

interface SimilarItem {
  exerciseId: string;
  title: string;
  subject: string;
  reason: string;
}

interface SimilarResponse {
  similar: SimilarItem[];
  __placeholder?: boolean;
}

type TabValue = 'hint' | 'feedback' | 'similar';

const HINT_LEVELS: Array<{ value: 1 | 2 | 3; key: 'level1' | 'level2' | 'level3' }> = [
  { value: 1, key: 'level1' },
  { value: 2, key: 'level2' },
  { value: 3, key: 'level3' },
];

function PlaceholderBadge() {
  const t = useTranslations('tutor');
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#0095D1]/40 bg-[#E6F4FA] px-2 py-0.5 text-[11px] font-semibold text-[#00709D]">
      <Sparkles className="size-3" />
      {t('placeholderBadge')}
    </span>
  );
}

interface ExercisePickerProps {
  value: string;
  onChange: (id: string) => void;
  options: ExerciseOption[];
  loading: boolean;
}

function ExercisePicker({ value, onChange, options, loading }: ExercisePickerProps) {
  const t = useTranslations('tutor');
  return (
    <div className="space-y-2">
      <Label htmlFor="tutor-exercise" className="text-[#003449]">
        {t('exerciseLabel')}
      </Label>
      {loading ? (
        <div className="flex h-14 w-full items-center gap-2 rounded-[16px] border-2 border-[#BBC8D4] bg-white px-4 text-sm text-[#3E4850]">
          <Loader2 className="size-4 animate-spin" />
          {t('loadingExercises')}
        </div>
      ) : (
        <Select
          value={value}
          onValueChange={(v) => onChange(v ?? '')}
        >
          <SelectTrigger id="tutor-exercise">
            <SelectValue placeholder={t('selectExercise')} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt._id} value={opt._id}>
                {opt.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function TutorTabs() {
  const t = useTranslations('tutor');

  // ── Exercises (shared picker source) ──────────────────────────────────────
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/exercises?limit=20');
        if (!res.ok) return;
        const data = (await res.json()) as {
          data?: Array<{ _id: string; title: string; subject: string }>;
        };
        if (cancelled) return;
        setExercises(
          (data.data ?? []).map((e) => ({
            _id: e._id,
            title: e.title,
            subject: e.subject,
          }))
        );
      } catch {
        // Swallow — UI shows the empty Select so users still see structure.
      } finally {
        if (!cancelled) setLoadingExercises(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Hint tab ──────────────────────────────────────────────────────────────
  const [hintExerciseId, setHintExerciseId] = useState('');
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);
  const [hint, setHint] = useState<HintResponse | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  async function requestHint() {
    if (!hintExerciseId) {
      setHintError(t('selectFirst'));
      return;
    }
    setHintError(null);
    setHintLoading(true);
    try {
      const res = await fetch('/api/tutor/hint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ exerciseId: hintExerciseId, level: hintLevel }),
      });
      if (!res.ok) {
        setHintError(t('errorGeneric'));
        return;
      }
      const data = (await res.json()) as HintResponse;
      setHint(data);
    } catch {
      setHintError(t('errorGeneric'));
    } finally {
      setHintLoading(false);
    }
  }

  // ── Feedback tab ──────────────────────────────────────────────────────────
  const [fbExerciseId, setFbExerciseId] = useState('');
  const [attempt, setAttempt] = useState('');
  const [fbImages, setFbImages] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);

  async function requestFeedback() {
    if (!fbExerciseId) {
      setFbError(t('selectFirst'));
      return;
    }
    if (!attempt.trim()) {
      setFbError(t('selectFirst'));
      return;
    }
    setFbError(null);
    setFbLoading(true);
    try {
      const res = await fetch('/api/tutor/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          exerciseId: fbExerciseId,
          attempt,
          images: fbImages,
        }),
      });
      if (!res.ok) {
        setFbError(t('errorGeneric'));
        return;
      }
      const data = (await res.json()) as FeedbackResponse;
      setFeedback(data);
    } catch {
      setFbError(t('errorGeneric'));
    } finally {
      setFbLoading(false);
    }
  }

  // ── Similar tab ───────────────────────────────────────────────────────────
  const [simExerciseId, setSimExerciseId] = useState('');
  const [similar, setSimilar] = useState<SimilarResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  async function requestSimilar() {
    if (!simExerciseId) {
      setSimError(t('selectFirst'));
      return;
    }
    setSimError(null);
    setSimLoading(true);
    try {
      const res = await fetch(
        `/api/tutor/similar?exerciseId=${encodeURIComponent(simExerciseId)}`
      );
      if (!res.ok) {
        setSimError(t('errorGeneric'));
        return;
      }
      const data = (await res.json()) as SimilarResponse;
      setSimilar(data);
    } catch {
      setSimError(t('errorGeneric'));
    } finally {
      setSimLoading(false);
    }
  }

  // Convert score (0..1) to a percentage label.
  const scorePct = useMemo(
    () => (feedback ? Math.round(feedback.score * 100) : null),
    [feedback]
  );

  return (
    <Tabs defaultValue="hint" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value={'hint' satisfies TabValue}>
          <Lightbulb className="size-4" />
          <span>{t('tabs.hint')}</span>
        </TabsTrigger>
        <TabsTrigger value={'feedback' satisfies TabValue}>
          <MessageSquare className="size-4" />
          <span>{t('tabs.feedback')}</span>
        </TabsTrigger>
        <TabsTrigger value={'similar' satisfies TabValue}>
          <Wand2 className="size-4" />
          <span>{t('tabs.similar')}</span>
        </TabsTrigger>
      </TabsList>

      {/* ── Hint tab ─────────────────────────────────────────────────────── */}
      <TabsContent value={'hint' satisfies TabValue} className="mt-6 space-y-4">
        <ExercisePicker
          value={hintExerciseId}
          onChange={setHintExerciseId}
          options={exercises}
          loading={loadingExercises}
        />

        <div className="space-y-2">
          <Label className="text-[#003449]">{t('hintLevel')}</Label>
          <div className="flex flex-wrap gap-2">
            {HINT_LEVELS.map((lvl) => (
              <Button
                key={lvl.value}
                type="button"
                size="sm"
                intent={hintLevel === lvl.value ? 'primary-blue' : 'secondary-blue'}
                onClick={() => setHintLevel(lvl.value)}
              >
                {t(lvl.key)}
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          intent="primary-blue"
          size="sm"
          onClick={requestHint}
          loading={hintLoading}
          disabled={hintLoading}
        >
          {hintLoading ? t('thinking') : t('getHint')}
        </Button>

        {hintError && (
          <p className="text-sm text-[#ED2D30]" role="alert">
            {hintError}
          </p>
        )}

        {hint && (
          <div className="rounded-2xl border border-[#D9EFF8] bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#00709D]">
                <Lightbulb className="size-4" />
                {t(`level${hint.level}` as 'level1' | 'level2' | 'level3')}
              </span>
              {hint.__placeholder && <PlaceholderBadge />}
            </div>
            <p className="text-base leading-7 text-[#003449]">{hint.hint}</p>
            {hint.exhausted && (
              <p className="mt-3 text-sm text-[#3E4850]">
                {t('exhaustedHints')}
              </p>
            )}
          </div>
        )}
      </TabsContent>

      {/* ── Feedback tab ─────────────────────────────────────────────────── */}
      <TabsContent
        value={'feedback' satisfies TabValue}
        className="mt-6 space-y-4"
      >
        <ExercisePicker
          value={fbExerciseId}
          onChange={setFbExerciseId}
          options={exercises}
          loading={loadingExercises}
        />

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
        </div>

        <div className="space-y-2">
          <Label className="text-[#003449]">{t('attachImages')}</Label>
          <FileUploadZone
            accept="image/*"
            maxFiles={5}
            value={fbImages}
            onChange={setFbImages}
            label={t('attachImages')}
          />
        </div>

        <Button
          type="button"
          intent="primary-blue"
          size="sm"
          onClick={requestFeedback}
          loading={fbLoading}
          disabled={fbLoading}
        >
          {fbLoading ? t('thinking') : t('submitForFeedback')}
        </Button>

        {fbError && (
          <p className="text-sm text-[#ED2D30]" role="alert">
            {fbError}
          </p>
        )}

        {feedback && (
          <div className="space-y-4 rounded-2xl border border-[#D9EFF8] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#00709D]">
                  {t('score')}
                </p>
                <p className="text-3xl font-bold text-[#003449]">
                  {scorePct}
                  <span className="ms-1 text-base font-semibold text-[#3E4850]">
                    / 100
                  </span>
                </p>
              </div>
              {feedback.__placeholder && <PlaceholderBadge />}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#00709D]">
                {t('lineComments')}
              </p>
              <ul className="space-y-2">
                {feedback.comments.map((c) => (
                  <li
                    key={`${c.line}-${c.text}`}
                    className="flex gap-3 rounded-xl bg-[#F9FBFD] p-3 text-sm text-[#003449]"
                  >
                    <span className="shrink-0 rounded-full bg-[#E6F4FA] px-2 py-0.5 text-xs font-bold text-[#00709D]">
                      {t('lineLabel', { line: c.line })}
                    </span>
                    <span className="leading-6">{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-[#00709D]">
                {t('summary')}
              </p>
              <p className="text-base leading-7 text-[#003449]">
                {feedback.summary}
              </p>
            </div>
          </div>
        )}
      </TabsContent>

      {/* ── Similar tab ──────────────────────────────────────────────────── */}
      <TabsContent
        value={'similar' satisfies TabValue}
        className="mt-6 space-y-4"
      >
        <ExercisePicker
          value={simExerciseId}
          onChange={setSimExerciseId}
          options={exercises}
          loading={loadingExercises}
        />

        <Button
          type="button"
          intent="primary-blue"
          size="sm"
          onClick={requestSimilar}
          loading={simLoading}
          disabled={simLoading}
        >
          {simLoading ? t('thinking') : t('findSimilar')}
        </Button>

        {simError && (
          <p className="text-sm text-[#ED2D30]" role="alert">
            {simError}
          </p>
        )}

        {similar && (
          <div className="space-y-3">
            {similar.__placeholder && (
              <div className="flex justify-end">
                <PlaceholderBadge />
              </div>
            )}
            {similar.similar.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#BBC8D4] bg-[#F9FBFD] p-6 text-center text-sm text-[#3E4850]">
                {t('noResults')}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {similar.similar.map((s) => (
                  <li key={s.exerciseId}>
                    <Link
                      href={`/exercises/${s.exerciseId}` as '/'}
                      className={cn(
                        'flex h-full flex-col gap-2 rounded-2xl border border-[#D9EFF8] bg-white p-4 shadow-sm transition-colors',
                        'hover:border-[#0095D1] hover:bg-[#F9FBFD] focus-visible:border-[#0095D1] focus-visible:outline-none'
                      )}
                    >
                      <span className="inline-flex w-fit items-center rounded-full bg-[#E6F4FA] px-2 py-0.5 text-xs font-semibold text-[#00709D]">
                        {s.subject}
                      </span>
                      <h3 className="line-clamp-2 text-base font-bold text-[#003449]">
                        {s.title}
                      </h3>
                      <p className="line-clamp-3 text-sm text-[#3E4850]">
                        {s.reason}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default TutorTabs;
