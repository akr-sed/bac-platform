'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExerciseDTO } from '@/types';

const exerciseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  subtopic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface ExerciseFormProps {
  exercise?: ExerciseDTO;
  onSuccess?: (exercise: ExerciseDTO) => void;
}

export default function ExerciseForm({ exercise, onSuccess }: ExerciseFormProps) {
  const t = useTranslations('exercises.fields');
  const tDiff = useTranslations('exercises.difficulty');
  const tFilter = useTranslations('exercises.filter');
  const tCommon = useTranslations('common');
  const [serverError, setServerError] = useState('');
  const [attachments, setAttachments] = useState<string[]>(
    exercise?.attachments || []
  );
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: exercise?.title || '',
      description: exercise?.description || '',
      subject: exercise?.subject || '',
      topic: exercise?.topic || '',
      subtopic: exercise?.subtopic || '',
      difficulty: exercise?.difficulty || 'medium',
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [...prev, ...data.urls]);
      }
    } catch {
      setServerError(tCommon('error'));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ExerciseFormData) {
    setServerError('');
    try {
      const url = exercise
        ? `/api/exercises/${exercise._id}`
        : '/api/exercises';
      const method = exercise ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, attachments }),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || tCommon('error'));
        return;
      }

      onSuccess?.(result);
    } catch {
      setServerError(tCommon('error'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">{t('title')}</Label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <p className="text-sm text-red-600">{t('title')} is required</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea id="description" rows={6} {...register('description')} />
        {errors.description && (
          <p className="text-sm text-red-600">
            {t('description')} is required
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subject">{t('subject')}</Label>
          <Input id="subject" {...register('subject')} />
          {errors.subject && (
            <p className="text-sm text-red-600">{t('subject')} is required</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">{t('topic')}</Label>
          <Input id="topic" {...register('topic')} />
          {errors.topic && (
            <p className="text-sm text-red-600">{t('topic')} is required</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subtopic">{t('subtopic')}</Label>
          <Input id="subtopic" {...register('subtopic')} />
        </div>

        <div className="space-y-2">
          <Label>{tFilter('difficulty')}</Label>
          <Controller
            control={control}
            name="difficulty"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => value && field.onChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{tDiff('easy')}</SelectItem>
                  <SelectItem value="medium">{tDiff('medium')}</SelectItem>
                  <SelectItem value="hard">{tDiff('hard')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachments">{t('attachments')}</Label>
        <Input
          id="attachments"
          type="file"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
        />
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((url, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                {url.split('/').pop()}
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="ms-1 text-slate-400 hover:text-slate-700"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || uploading}
        className="w-full rounded-full"
        size="lg"
      >
        {isSubmitting ? '...' : tCommon('submit')}
      </Button>
    </form>
  );
}
