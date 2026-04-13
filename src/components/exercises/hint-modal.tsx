'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Lightbulb, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AIDisclaimerBanner } from '@/components/ui/ai-disclaimer-banner';

interface HintModalProps {
  exerciseId: string;
  exerciseTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HintModal({
  exerciseId,
  exerciseTitle,
  open,
  onOpenChange,
}: HintModalProps) {
  const t = useTranslations('ai');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(false);
    setHint('');

    fetch(`/api/exercises/${exerciseId}/hint`, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHint(data.hint ?? '');
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open, exerciseId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl">
            <Lightbulb className="size-5 text-ai-accent" />
            {t('hint')}
          </DialogTitle>
          {exerciseTitle && (
            <p className="text-sm text-muted-foreground">{exerciseTitle}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <AIDisclaimerBanner message={t('disclaimer')} />

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-ai-accent" />
              <span className="ms-2 text-sm text-muted-foreground">{t('generating')}</span>
            </div>
          )}

          {error && (
            <p className="py-4 text-center text-sm text-destructive">{t('error')}</p>
          )}

          {hint && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground/90">
              {hint}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
