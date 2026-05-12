'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
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

interface SubmitSolutionDialogProps {
  exerciseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_IMAGES = 5;

export function SubmitSolutionDialog({
  exerciseId,
  open,
  onOpenChange,
}: SubmitSolutionDialogProps) {
  const t = useTranslations('solutions');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = content.trim();
  const canSubmit = !submitting && (trimmed.length > 0 || images.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, images }),
      });
      if (res.ok) {
        setContent('');
        setImages([]);
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
            <Label htmlFor="solution-content">{t('fields.content')}</Label>
            <Textarea
              id="solution-content"
              placeholder={t('placeholder')}
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('images')}</Label>
            <FileUploadZone
              accept="image/*"
              maxFiles={MAX_IMAGES}
              value={images}
              onChange={setImages}
              label={t('addImages')}
              counterLabel={t('imagesLabel')}
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
