'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadZone } from '@/components/ui/file-upload-zone';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export default function NewExercisePage() {
  const t = useTranslations('exercises');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const form = new FormData(e.currentTarget);

    try {
      // Upload files first if any
      let attachments: string[] = [];
      if (files.length > 0) {
        const uploadData = new FormData();
        files.forEach((f) => uploadData.append('files', f));
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          attachments = uploadJson.urls ?? [];
        }
      }

      // Send exercise data as JSON
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          description: form.get('description'),
          difficulty: form.get('difficulty'),
          subject: form.get('subject'),
          topic: form.get('topic'),
          subtopic: form.get('subtopic') || '',
          attachments,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/exercises/${data._id ?? data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create exercise');
      }
    } catch {
      setError('Server error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('browse')}
      </Link>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight text-foreground">
            {t('post')}
          </h1>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{t('fields.title')}</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder={t('fields.title')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('fields.description')}</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={6}
                placeholder={t('fields.description')}
                className="resize-y"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="subject">{t('fields.subject')}</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder={t('fields.subject')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">{t('fields.topic')}</Label>
                <Input
                  id="topic"
                  name="topic"
                  placeholder={t('fields.topic')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtopic">{t('fields.subtopic')}</Label>
                <Input
                  id="subtopic"
                  name="subtopic"
                  placeholder={t('fields.subtopic')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('filter.difficulty')}</Label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {DIFFICULTIES.map((d) => (
                  <label
                    key={d}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 transition-all duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5 sm:flex-none"
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={d}
                      defaultChecked={d === 'medium'}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-sm font-medium">{t(`difficulty.${d}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('fields.attachments')}</Label>
              <FileUploadZone
                onFilesChange={setFiles}
                label={t('fields.attachments')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="submit"
                className="w-full cursor-pointer gap-2 rounded-xl sm:w-auto"
                disabled={submitting}
              >
                <Send className="size-4" />
                {submitting ? tCommon('loading') : tCommon('submit')}
              </Button>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full cursor-pointer rounded-xl sm:w-auto')}
              >
                {tCommon('cancel')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
