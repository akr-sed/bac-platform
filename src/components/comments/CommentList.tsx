'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import CommentForm from '@/components/comments/CommentForm';
import type { CommentDTO } from '@/types';

interface CommentListProps {
  solutionId: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function CommentList({ solutionId }: CommentListProps) {
  const t = useTranslations('solutions');
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/solutions/${solutionId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [solutionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">...</p>;
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('addComment')}
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment, index) => (
            <div key={comment._id}>
              {index > 0 && <Separator className="mb-3" />}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <CommentForm solutionId={solutionId} onCommentAdded={fetchComments} />
    </div>
  );
}
