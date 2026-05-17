'use client';

import { useState } from 'react';
import { MoreVertical, Flag, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ReportTargetType = 'exercise' | 'solution' | 'comment' | 'user';

interface ReportActionMenuProps {
  targetType: ReportTargetType;
  targetId: string;
  className?: string;
}

/**
 * Kebab menu rendered next to user-generated content (exercises, solutions,
 * comments) that exposes a single "Report" action. Clicking it opens a
 * Dialog with a textarea for the reason and posts to /api/reports.
 *
 * Author check (don't render for one's own content) is handled by the
 * parent — keeping this component dumb.
 */
export function ReportActionMenu({
  targetType,
  targetId,
  className,
}: ReportActionMenuProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setReason('');
      setError(null);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('reportDialog.reasonLabel'));
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: trimmed,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('reportDialog.success'));
      handleOpenChange(false);
    } catch {
      toast.error(t('reportDialog.error'));
      setSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('actions.report')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className={cn('size-9 text-muted-foreground', className)}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="min-w-[140px]">
          <DropdownMenuItem
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            <Flag className="size-4" />
            <span>{t('actions.report')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>{t('reportDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('reportDialog.reasonPlaceholder')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="report-reason"
                className="text-xs font-semibold text-foreground"
              >
                {t('reportDialog.reasonLabel')}
              </label>
              <Textarea
                id="report-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('reportDialog.reasonPlaceholder')}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'report-reason-error' : undefined}
                className="min-h-[120px]"
              />
              {error && (
                <p
                  id="report-reason-error"
                  className="text-xs font-medium text-destructive"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer rounded-xl"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                {t('reportDialog.cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="cursor-pointer rounded-xl"
                disabled={submitting}
              >
                {submitting && <Loader2 className="me-2 size-4 animate-spin" />}
                {t('reportDialog.submit')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReportActionMenu;
