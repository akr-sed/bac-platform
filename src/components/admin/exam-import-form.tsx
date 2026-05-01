'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Loader2, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { topicLabel } from '@/lib/exam-topic-labels';

interface ParsedExercise {
  id?: string;
  number?: number;
  topic?: string;
  marks?: number | null;
  has_figure?: boolean;
  source_page?: number | null;
  statement?: string;
}

interface ParsedPayload {
  exam_id?: string;
  exercises?: ParsedExercise[];
  figures?: unknown[];
}

interface FormState {
  title: string;
  year: string;
  subject: string;
  level: string;
}

const inferYearFromName = (name: string): string => {
  const m = name.match(/(19|20)\d{2}/);
  return m ? m[0] : '';
};

export function ExamImportForm() {
  const t = useTranslations('admin.importExam');
  const router = useRouter();

  const [pasted, setPasted] = useState('');
  const [filename, setFilename] = useState('');
  const [parseError, setParseError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [meta, setMeta] = useState<FormState>({
    title: '',
    year: '',
    subject: 'math',
    level: '3AS',
  });

  // Parse the pasted JSON whenever it changes. Errors are shown as warnings, not fatal.
  const parsed: ParsedPayload | null = useMemo(() => {
    if (!pasted.trim()) return null;
    try {
      const value = JSON.parse(pasted);
      return value as ParsedPayload;
    } catch {
      return null;
    }
  }, [pasted]);

  const exercises = parsed?.exercises ?? [];

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setSubmitError('');
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    try {
      const text = await file.text();
      setPasted(text);
      // Try to parse to populate metadata defaults.
      try {
        JSON.parse(text);
        const inferredYear = inferYearFromName(file.name);
        setMeta((m) => ({
          ...m,
          title: m.title || `BAC ${inferredYear || ''} — math`.trim(),
          year: m.year || inferredYear,
        }));
      } catch {
        setParseError(t('errorParse'));
      }
    } catch {
      setParseError(t('errorParse'));
    }
  };

  const onPasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPasted(e.target.value);
    setParseError('');
    setSubmitError('');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');
    setSuccess(false);

    if (!pasted.trim()) {
      setSubmitError(t('errorRequired'));
      return;
    }

    if (!parsed) {
      setSubmitError(t('errorParse'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...parsed,
        title: meta.title || undefined,
        year: meta.year ? parseInt(meta.year, 10) : undefined,
        subject: meta.subject || undefined,
        level: meta.level || undefined,
        filename: filename || undefined,
      };

      const res = await fetch('/api/exams/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitError(data.error || t('errorServer'));
        return;
      }

      const data = (await res.json()) as { exam: { _id: string } };
      setSuccess(true);
      router.push(`/exams/${data.exam._id}`);
    } catch {
      setSubmitError(t('errorServer'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Source */}
      <Card className="rounded-xl border border-border p-6 shadow-sm">
        <CardContent className="space-y-5 p-0">
          <div>
            <Label htmlFor="exam-file" className="mb-2 block text-sm font-semibold">
              {t('uploadLabel')}
            </Label>
            <Input
              id="exam-file"
              type="file"
              accept=".json,application/json"
              onChange={onFileChange}
              className="cursor-pointer"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('uploadHelp')}</p>
          </div>

          <div>
            <Label htmlFor="exam-paste" className="mb-2 block text-sm font-semibold">
              {t('pasteLabel')}
            </Label>
            <Textarea
              id="exam-paste"
              value={pasted}
              onChange={onPasteChange}
              placeholder={t('pastePlaceholder')}
              className="min-h-40 font-mono text-xs"
              dir="ltr"
            />
          </div>

          {parseError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {parseError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="rounded-xl border border-border p-6 shadow-sm">
        <CardContent className="space-y-4 p-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t('examMetadata')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="exam-title" className="mb-2 block text-sm">
                {t('fieldTitle')}
              </Label>
              <Input
                id="exam-title"
                value={meta.title}
                onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="exam-year" className="mb-2 block text-sm">
                {t('fieldYear')}
              </Label>
              <Input
                id="exam-year"
                type="number"
                min={1990}
                max={2100}
                value={meta.year}
                onChange={(e) => setMeta((m) => ({ ...m, year: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="exam-subject" className="mb-2 block text-sm">
                {t('fieldSubject')}
              </Label>
              <Input
                id="exam-subject"
                value={meta.subject}
                onChange={(e) => setMeta((m) => ({ ...m, subject: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="exam-level" className="mb-2 block text-sm">
                {t('fieldLevel')}
              </Label>
              <Input
                id="exam-level"
                value={meta.level}
                onChange={(e) => setMeta((m) => ({ ...m, level: e.target.value }))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="rounded-xl border border-border p-6 shadow-sm">
        <CardContent className="space-y-4 p-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t('preview')}
          </h2>

          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('previewEmpty')}</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {exercises.map((ex, i) => (
                <li key={ex.id ?? i} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="font-medium text-foreground">
                    {t('previewExerciseLabel', { number: ex.number ?? i + 1 })}
                  </span>
                  {ex.topic && (
                    <Badge variant="secondary" className="text-xs">
                      {topicLabel(ex.topic, 'ar')}
                    </Badge>
                  )}
                  {typeof ex.marks === 'number' && (
                    <Badge variant="outline" className="text-xs">
                      {t('previewMarks', { marks: ex.marks })}
                    </Badge>
                  )}
                  {ex.has_figure && (
                    <Badge variant="outline" className="text-xs">
                      {t('previewHasFigure')}
                    </Badge>
                  )}
                  {typeof ex.source_page === 'number' && (
                    <span className="ms-auto text-xs text-muted-foreground">
                      {t('previewPage', { page: ex.source_page })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {submitError && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          {submitError}
        </p>
      )}

      {success && (
        <p className="text-sm text-foreground">{t('successRedirect')}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting || exercises.length === 0}
          className="cursor-pointer gap-2 rounded-xl"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
