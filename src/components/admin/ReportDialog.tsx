'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ReportDialogProps {
  targetType: 'exercise' | 'solution' | 'comment' | 'user';
  targetId: string;
  trigger: React.ReactNode;
}

const REASON_KEYS = ['spam', 'inappropriate', 'incorrect', 'other'] as const;

export default function ReportDialog({
  targetType,
  targetId,
  trigger,
}: ReportDialogProps) {
  const t = useTranslations('moderation');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    const finalReason = reason === 'other' && otherText ? otherText : reason;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason: finalReason }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setReason('');
          setOtherText('');
        }, 1500);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('report')}</DialogTitle>
          <DialogDescription>{t('reportReason')}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="py-4 text-center text-sm text-green-600">
            {t('reported')}
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <Select value={reason} onValueChange={(v) => setReason(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder={t('reportReason')} />
              </SelectTrigger>
              <SelectContent>
                {REASON_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`reasons.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reason === 'other' && (
              <Input
                placeholder={t('reportReason')}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
              />
            )}
          </div>
        )}

        {!submitted && (
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={!reason || (reason === 'other' && !otherText) || submitting}
            >
              {t('report')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
