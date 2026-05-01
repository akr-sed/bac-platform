'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

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

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">{t('title')}</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
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
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subject">{t('subject')}</Label>
            <select
              id="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
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
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledAt">{t('scheduledAt')}</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
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
          />
          <p className="text-xs text-muted-foreground">
            {t('meetingUrlHelp')}
          </p>
        </div>

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
            />
            <p className="text-xs text-muted-foreground">{t('priceHelp')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topics">{t('topics')}</Label>
          <Input
            id="topics"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder={t('topicsPlaceholder')}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Card>
  );
}
