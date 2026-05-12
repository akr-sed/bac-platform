'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { MathText } from '@/components/ui/math-text';
import { cn } from '@/lib/utils';

interface SubmitSolutionDialogProps {
  exerciseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_ATTACHMENTS = 5;

export function SubmitSolutionDialog({
  exerciseId,
  open,
  onOpenChange,
}: SubmitSolutionDialogProps) {
  const t = useTranslations('solutions');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  const trimmed = content.trim();
  const canSubmit = !submitting && (trimmed.length > 0 || attachments.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, images: attachments }),
      });
      if (res.ok) {
        setContent('');
        setAttachments([]);
        setMode('write');
        onOpenChange(false);
      }
    } catch {
      /* handle error */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{t('submit')}</DialogTitle>
          <DialogDescription>{t('placeholder')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="solution-content">{t('fields.content')}</Label>
              <div
                className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
                role="tablist"
                aria-label={t('compose.modeLabel')}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'write'}
                  onClick={() => setMode('write')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    mode === 'write'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Pencil className="size-3.5" />
                  {t('compose.write')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'preview'}
                  onClick={() => setMode('preview')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    mode === 'preview'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Eye className="size-3.5" />
                  {t('compose.preview')}
                </button>
              </div>
            </div>

            {mode === 'write' ? (
              <Textarea
                id="solution-content"
                placeholder={t('compose.placeholderWithMath')}
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-y font-mono text-sm"
              />
            ) : (
              <div className="min-h-[148px] rounded-md border border-border bg-muted/20 p-4">
                {trimmed.length > 0 ? (
                  <MathText className="text-sm leading-relaxed">{content}</MathText>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('compose.previewEmpty')}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('compose.mathHint')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('attachments')}</Label>
            <FileUploadZone
              accept="image/*,application/pdf"
              maxFiles={MAX_ATTACHMENTS}
              value={attachments}
              onChange={setAttachments}
              label={t('addAttachments')}
              counterLabel={t('attachmentsLabel')}
            />
          </div>

          <Button
            className="w-full cursor-pointer gap-2 rounded-xl"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Send className="size-4" />
            {submitting ? '...' : t('submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
