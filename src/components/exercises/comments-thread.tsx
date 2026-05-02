'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Comment {
  _id: string;
  content: string;
  author?: { _id: string; name: string; avatar?: string | null };
  createdAt?: string;
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
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/solutions/${solutionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data]);
        setNewComment('');
      }
    } catch {
      /* handle error */
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
          {comments.map((c) => (
            <li key={c._id} className="group flex items-start gap-3">
              <UserAvatar src={c.author?.avatar} name={c.author?.name} size="sm" className="size-7 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {c.author?.name ?? 'Anonymous'}
                  </span>
                  {c.createdAt && (
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  {authUser && c.author?._id === authUser._id && (
                    <button
                      type="button"
                      className="cursor-pointer text-muted-foreground/50 opacity-0 transition-opacity duration-200 hover:text-destructive group-hover:opacity-100"
                      onClick={() => setDeleteTarget(c._id)}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
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
          className="h-11 flex-1 rounded-2xl bg-card"
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
