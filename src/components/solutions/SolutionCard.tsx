'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, BadgeCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LikeButton from './LikeButton';
import CommentList from '@/components/comments/CommentList';
import { ImageLightbox } from '@/components/exercises/image-lightbox';
import { MathText } from '@/components/ui/math-text';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import type { SolutionDTO } from '@/types';

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url);
}

interface SolutionCardProps {
  solution: SolutionDTO;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function SolutionCard({ solution }: SolutionCardProps) {
  const t = useTranslations('solutions');
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isOfficial, setIsOfficial] = useState<boolean>(!!solution.isOfficial);
  const [togglingOfficial, setTogglingOfficial] = useState(false);

  const attachments = solution.images ?? [];
  const imageAttachments = attachments.filter((u) => !isPdfUrl(u));
  const pdfAttachments = attachments.filter(isPdfUrl);

  const isAuthor = user?._id === solution.author?._id;
  const canMarkOfficial = isAuthor && user?.role === 'teacher';

  async function toggleOfficial() {
    if (!canMarkOfficial || togglingOfficial) return;
    const next = !isOfficial;
    setTogglingOfficial(true);
    setIsOfficial(next);
    try {
      const res = await fetch(`/api/solutions/${solution._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOfficial: next }),
      });
      if (!res.ok) setIsOfficial(!next);
    } catch {
      setIsOfficial(!next);
    } finally {
      setTogglingOfficial(false);
    }
  }

  return (
    <Card className={cn(isOfficial && 'border-success/40 ring-1 ring-success/20')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
              {solution.author?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-slate-900">
                  {solution.author?.name || 'Unknown'}
                </p>
                {isOfficial && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success"
                    title={t('officialBadge')}
                  >
                    <BadgeCheck className="size-3" />
                    {t('officialBadge')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {timeAgo(solution.createdAt)}
              </p>
            </div>
          </div>

          {canMarkOfficial && (
            <button
              type="button"
              onClick={toggleOfficial}
              disabled={togglingOfficial}
              aria-pressed={isOfficial}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isOfficial
                  ? 'border-success/40 bg-success/10 text-success hover:bg-success/15'
                  : 'border-border bg-card text-muted-foreground hover:border-success/40 hover:text-success',
                togglingOfficial && 'opacity-60'
              )}
            >
              {togglingOfficial ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <BadgeCheck className="size-3" />
              )}
              {isOfficial ? t('unmarkOfficial') : t('markOfficial')}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <MathText className="text-sm leading-relaxed text-slate-700">
          {solution.content}
        </MathText>

        {imageAttachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {imageAttachments.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition-opacity duration-200 hover:opacity-80"
                aria-label={`Open image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Solution image ${i + 1}`}
                  className="h-24 w-auto object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {pdfAttachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pdfAttachments.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <FileText className="size-4 text-destructive" />
                {t('pdfAttachment', { index: i + 1 })}
              </a>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <LikeButton
            solutionId={solution._id}
            initialLikes={solution.likes}
            initialLikesCount={solution.likesCount}
          />
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
            <span>
              {t('comments', { count: solution.commentCount })}
            </span>
          </button>
        </div>

        {showComments && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <CommentList solutionId={solution._id} />
          </div>
        )}
      </CardContent>

      {imageAttachments.length > 0 && (
        <ImageLightbox
          images={imageAttachments}
          initialIndex={lightboxIndex ?? 0}
          open={lightboxIndex !== null}
          onOpenChange={(o) => {
            if (!o) setLightboxIndex(null);
          }}
        />
      )}
    </Card>
  );
}
