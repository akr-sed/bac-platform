'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SUBJECTS = [
  'math',
  'physics',
  'chemistry',
  'biology',
  'arabic-lit',
  'french-lit',
  'philosophy',
  'history',
  'english',
] as const;

export function SessionForm() {
  const t = useTranslations('sessions.form');
  const tSubjects = useTranslations('subjects');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<string>('math');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [priceDA, setPriceDA] = useState(0);
  const [topics, setTopics] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const topicsArr = topics
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const body = {
      title,
      description,
      subject,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes,
      meetingUrl,
      capacity: capacity ? parseInt(capacity, 10) : null,
      priceDA,
      topics: topicsArr,
      // exerciseIds intentionally omitted — TODO add exercise picker
    };

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? t('error'));
      }
      const data = await res.json();
      router.push(`/sessions/${data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      setSubmitting(false);
    }
  }

  const inputCls = 'h-11 rounded-2xl';

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <Section eyebrow="01" title={t('title')}>
        <div className="space-y-2">
          <Label htmlFor="title">{t('title')}</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className={inputCls}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('description')}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
            className="rounded-2xl"
          />
        </div>
      </Section>

      <Section eyebrow="02" title={t('subject')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subject">{t('subject')}</Label>
            <select
              id="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {tSubjects(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">{t('duration')}</Label>
            <Input
              id="duration"
              type="number"
              required
              min={15}
              max={480}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topics">{t('topics')}</Label>
          <Input
            id="topics"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder={t('topicsPlaceholder')}
            className={inputCls}
          />
        </div>
      </Section>

      <Section eyebrow="03" title={t('scheduledAt')}>
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">{t('scheduledAt')}</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={`${inputCls} font-mono tabular-nums`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingUrl">{t('meetingUrl')}</Label>
          <Input
            id="meetingUrl"
            type="url"
            required
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder={t('meetingUrlPlaceholder')}
            className={inputCls}
          />
          <p className="text-xs text-muted-foreground">
            {t('meetingUrlHelp')}
          </p>
        </div>
      </Section>

      <Section eyebrow="04" title={t('priceDA')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity">{t('capacity')}</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder={t('capacityPlaceholder')}
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceDA">{t('priceDA')}</Label>
            <Input
              id="priceDA"
              type="number"
              min={0}
              value={priceDA}
              onChange={(e) => setPriceDA(parseInt(e.target.value, 10) || 0)}
              className={`${inputCls} font-mono tabular-nums`}
            />
            <p className="text-xs text-muted-foreground">{t('priceHelp')}</p>
          </div>
        </div>
      </Section>

      {error && (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={submitting}
          className="group h-12 cursor-pointer gap-2 rounded-2xl px-7 text-base font-medium active:scale-[0.98]"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {t('submit')}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
          {eyebrow}
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
