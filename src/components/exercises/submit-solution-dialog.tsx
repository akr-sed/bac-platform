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

export function SubmitSolutionDialog({
  exerciseId,
  open,
  onOpenChange,
}: SubmitSolutionDialogProps) {
  const t = useTranslations('solutions');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      // Upload images first if any
      let images: string[] = [];
      if (files.length > 0) {
        const uploadData = new FormData();
        files.forEach((f) => uploadData.append('files', f));
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          images = uploadJson.urls ?? [];
        }
      }

      const res = await fetch(`/api/exercises/${exerciseId}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, images }),
      });
      if (res.ok) {
        setContent('');
        setFiles([]);
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
            <Label>{t('fields.images')}</Label>
            <FileUploadZone
              accept="image/*"
              maxFiles={4}
              onFilesChange={setFiles}
              label={t('fields.images')}
            />
          </div>

          <Button
            className="w-full cursor-pointer gap-2 rounded-xl"
            disabled={!content.trim() || submitting}
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
