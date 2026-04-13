'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/providers/AuthProvider';

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  solutionId: string;
  onCommentAdded?: () => void;
}

export default function CommentForm({ solutionId, onCommentAdded }: CommentFormProps) {
  const t = useTranslations('solutions');
  const { user } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  if (!user) return null;

  async function onSubmit(data: CommentFormData) {
    setServerError('');
    try {
      const res = await fetch(`/api/solutions/${solutionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        setServerError(result.error || 'An error occurred');
        return;
      }

      reset();
      onCommentAdded?.();
    } catch {
      setServerError('An error occurred');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        placeholder={t('addComment')}
        rows={3}
        {...register('content')}
      />
      {serverError && (
        <p className="text-sm text-red-600">{serverError}</p>
      )}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? '...' : t('comment')}
      </Button>
    </form>
  );
}
