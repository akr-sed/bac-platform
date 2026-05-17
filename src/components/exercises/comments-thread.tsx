'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { MathTextInline } from '@/components/ui/math-text';
import { useAuth } from '@/components/providers/AuthProvider';
import { ReportActionMenu } from '@/components/ui/report-action-menu';
import ReputationBadge from '@/components/profile/ReputationBadge';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type CommentKind = 'comment' | 'tip' | 'mistake';

interface Comment {
  _id: string;
  content: string;
  kind?: CommentKind;
  author?: {
    _id: string;
    name: string;
    avatar?: string | null;
    points?: number;
    role?: string;
    isVerifiedTeacher?: boolean;
  };
  createdAt?: string;
  // Set on optimistic placeholders so we can reconcile / roll back.
  _optimisticId?: string;
}

interface CommentsThreadProps {
  solutionId: string;
}

export function CommentsThread({ solutionId }: CommentsThreadProps) {
  const t = useTranslations('solutions');
  const { user: authUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newKind, setNewKind] = useState<CommentKind>('comment');
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteComment = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== deleteTarget));
      }
    } catch { /* */ } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/solutions/${solutionId}/comments`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [solutionId]);

  const handleSend = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !authUser) return;

    // Build an optimistic placeholder from the current auth user so the new
    // row renders identically to a server-fetched comment (avatar + name +
    // ReputationBadge + kind chip + timestamp) without waiting on the POST.
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const kindToSend = newKind;
    const optimistic: Comment = {
      _id: optimisticId,
      _optimisticId: optimisticId,
      content: trimmed,
      kind: kindToSend,
      createdAt: new Date().toISOString(),
      author: {
        _id: authUser._id,
        name: authUser.name,
        avatar: authUser.avatar ?? null,
        points: authUser.points,
        role: authUser.role,
        isVerifiedTeacher: authUser.isVerifiedTeacher,
      },
    };

    setComments((prev) => [...prev, optimistic]);
    setNewComment('');
    setNewKind('comment');
    setSending(true);

    try {
      const res = await fetch(`/api/solutions/${solutionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, kind: kindToSend }),
      });
      if (res.ok) {
        const data: Comment = await res.json();
        // Replace the optimistic placeholder with the server response so
        // `_id` (used for delete) and any server-side normalisations stick.
        setComments((prev) =>
          prev.map((c) => (c._optimisticId === optimisticId ? data : c))
        );
      } else {
        // Roll back on failure (validation, auth, server error).
        setComments((prev) => prev.filter((c) => c._optimisticId !== optimisticId));
        setNewComment(trimmed);
        setNewKind(kindToSend);
      }
    } catch {
      setComments((prev) => prev.filter((c) => c._optimisticId !== optimisticId));
      setNewComment(trimmed);
      setNewKind(kindToSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-5">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">No comments yet</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const isOwn = authUser && c.author?._id === authUser._id;
            const canReport =
              authUser && c.author?._id && c.author._id !== authUser._id;
            const kind: CommentKind = c.kind ?? 'comment';
            return (
              <li key={c._id} className="group flex items-start gap-3">
                {c.author?._id ? (
                  <Link
                    href={`/profile/${c.author._id}` as `/profile/${string}`}
                    className="shrink-0 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={c.author?.name ?? 'Anonymous'}
                  >
                    <UserAvatar src={c.author?.avatar} name={c.author?.name} size="sm" className="size-7 shrink-0" />
                  </Link>
                ) : (
                  <UserAvatar src={c.author?.avatar} name={c.author?.name} size="sm" className="size-7 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {c.author?._id ? (
                      <Link
                        href={`/profile/${c.author._id}` as `/profile/${string}`}
                        className="text-xs font-medium text-foreground transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {c.author?.name ?? 'Anonymous'}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-foreground">
                        {c.author?.name ?? 'Anonymous'}
                      </span>
                    )}
                    {typeof c.author?.points === 'number' && (
                      <ReputationBadge points={c.author.points} />
                    )}
                    {kind === 'tip' && (
                      <Badge
                        variant="secondary"
                        className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      >
                        {t('kind.tip')}
                      </Badge>
                    )}
                    {kind === 'mistake' && (
                      <Badge
                        variant="secondary"
                        className="border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100"
                      >
                        {t('kind.mistake')}
                      </Badge>
                    )}
                    {c.createdAt && (
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    {isOwn && (
                      <button
                        type="button"
                        className="cursor-pointer text-muted-foreground/50 opacity-0 transition-opacity duration-200 hover:text-destructive group-hover:opacity-100"
                        onClick={() => setDeleteTarget(c._id)}
                        aria-label="Delete comment"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                    {canReport && (
                      <ReportActionMenu
                        targetType="comment"
                        targetId={c._id}
                        className="ms-auto size-7"
                      />
                    )}
                  </div>
                  <MathTextInline className="mt-0.5 block text-sm leading-relaxed text-foreground/90">
                    {c.content}
                  </MathTextInline>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={newKind}
          onValueChange={(v) => setNewKind((v ?? 'comment') as CommentKind)}
        >
          <SelectTrigger
            size="sm"
            aria-label={t('kindLabel')}
            className="w-auto min-w-32 shrink-0"
          >
            <SelectValue placeholder={t('kindLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comment">{t('kind.comment')}</SelectItem>
            <SelectItem value="tip">{t('kind.tip')}</SelectItem>
            <SelectItem value="mistake">{t('kind.mistake')}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={t('addComment')}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="h-11 min-w-0 flex-1 rounded-2xl bg-card"
        />
        <Button
          size="icon"
          className="size-11 shrink-0 cursor-pointer rounded-2xl active:scale-[0.96]"
          disabled={!newComment.trim() || sending}
          onClick={handleSend}
          aria-label={t('comment')}
        >
          <Send className="size-4 rtl:rotate-180" />
        </Button>
      </div>

      {/* Delete comment confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg text-destructive">Delete comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="cursor-pointer rounded-xl" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="cursor-pointer rounded-xl" onClick={handleDeleteComment} disabled={deleting}>
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
