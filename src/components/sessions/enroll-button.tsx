'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Loader2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Props {
  sessionId: string;
  initialEnrolled: boolean;
  initialEnrolledCount: number;
  capacity: number | null;
  isOwner: boolean;
  isAuthenticated: boolean;
  isCancelled: boolean;
}

export function EnrollButton({
  sessionId,
  initialEnrolled,
  initialEnrolledCount,
  capacity,
  isOwner,
  isAuthenticated,
  isCancelled,
}: Props) {
  const t = useTranslations('sessions');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [count, setCount] = useState(initialEnrolledCount);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);
  // `pending` lives in state, which means React batches multiple synchronous
  // clicks before the setter takes effect — both clicks sail past the
  // `if (pending) return` guard and fire two POSTs. A ref is updated
  // synchronously and short-circuits the second click in the same tick.
  const inFlightRef = useRef(false);

  if (isOwner) {
    return (
      <Button disabled variant="outline" className="w-full">
        {t('ownerCannotEnroll')}
      </Button>
    );
  }

  if (isCancelled) {
    return (
      <Button disabled variant="outline" className="w-full">
        {t('cancelled')}
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="default"
        className="w-full"
        onClick={() => router.push('/login')}
      >
        {t('loginToEnroll')}
      </Button>
    );
  }

  const isFull =
    !enrolled && capacity != null && count >= capacity;

  async function handle() {
    if (inFlightRef.current || pending) return;
    inFlightRef.current = true;
    setErrorMsg(null);

    const wasEnrolled = enrolled;
    const wasCount = count;
    const next = !enrolled;
    // Clamp the optimistic count at >= 0 to avoid flashing -1 on unenroll
    // when the in-memory `count` is stale at 0.
    setEnrolled(next);
    setCount(Math.max(0, count + (next ? 1 : -1)));
    setPending(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/enroll`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'request failed');
      }
      const data = await res.json();
      setEnrolled(Boolean(data.isEnrolled));
      if (typeof data.enrolledCount === 'number') {
        setCount(data.enrolledCount);
      }
    } catch (err) {
      setEnrolled(wasEnrolled);
      setCount(wasCount);
      setErrorMsg(err instanceof Error ? err.message : 'error');
    } finally {
      setPending(false);
      inFlightRef.current = false;
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={enrolled && !pending ? () => setConfirmUnenroll(true) : handle}
        disabled={pending || isFull}
        variant={enrolled ? 'outline' : 'default'}
        className={cn('w-full', enrolled && 'border-primary text-primary')}
        aria-pressed={enrolled}
        aria-busy={pending || undefined}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t('enrolling')}
          </>
        ) : enrolled ? (
          <>
            <Check className="size-4" />
            {t('enrolled')}
          </>
        ) : isFull ? (
          <>
            <X className="size-4" />
            {t('full')}
          </>
        ) : (
          <>
            <UserPlus className="size-4" />
            {t('enroll')}
          </>
        )}
      </Button>
      {errorMsg && (
        <p className="text-xs text-destructive" role="alert">
          {errorMsg}
        </p>
      )}

      <Dialog
        open={confirmUnenroll}
        onOpenChange={(open) => {
          if (!pending) setConfirmUnenroll(open);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {t('unenrollConfirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('unenrollConfirmDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              className="cursor-pointer rounded-xl"
              onClick={() => setConfirmUnenroll(false)}
              disabled={pending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer rounded-xl"
              disabled={pending}
              aria-busy={pending || undefined}
              onClick={async () => {
                await handle();
                setConfirmUnenroll(false);
              }}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t('unenroll')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
