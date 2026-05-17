'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const solutionSchema = z.object({
  content: z.string().min(1),
});

type SolutionFormData = z.infer<typeof solutionSchema>;

interface SolutionFormProps {
  exerciseId: string;
  onSuccess?: () => void;
}

export default function SolutionForm({
  exerciseId,
  onSuccess,
}: SolutionFormProps) {
  const t = useTranslations('solutions');
  const tFields = useTranslations('solutions.fields');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SolutionFormData>({
    resolver: zodResolver(solutionSchema),
  });

  async function onSubmit(data: SolutionFormData) {
    setSubmitting(true);
    setError('');

    try {
      let imageUrls: string[] = [];

      // Upload images if any
      if (files && files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          setError('Failed to upload images');
          setSubmitting(false);
          return;
        }

        const uploadData = await uploadRes.json();
        imageUrls = uploadData.urls;
      }

      const res = await fetch(`/api/exercises/${exerciseId}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          images: imageUrls,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to submit solution');
        setSubmitting(false);
        return;
      }

      reset();
      setFiles(null);
      onSuccess?.();
    } catch {
      setError('Server error, please try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('submit')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">{tFields('content')}</Label>
            <Textarea
              id="content"
              placeholder={t('placeholder')}
              {...register('content')}
              aria-invalid={!!errors.content}
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">{tFields('images')}</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? '...' : t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
