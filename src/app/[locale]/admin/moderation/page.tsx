'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Trash2, Loader2, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ContentType = 'exercises' | 'solutions' | 'comments';

interface Author {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface Item {
  _id: string;
  title?: string;
  content?: string;
  description?: string;
  difficulty?: string;
  subject?: string;
  createdAt?: string;
  author?: Author;
  exercise?: { _id: string; title: string };
  solutionId?: string | null;
  likesCount?: number;
  commentsCount?: number;
  solutionCount?: number;
  featured?: boolean;
}

const TABS: { id: ContentType; label: string }[] = [
  { id: 'exercises', label: 'Exercises' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'comments', label: 'Comments' },
];

export default function ModerationPage() {
  const [tab, setTab] = useState<ContentType>('exercises');
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/content?type=${tab}&page=1&limit=20`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems(data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  async function toggleFeatured(item: Item) {
    if (tab !== 'exercises') return;
    const nextFeatured = !item.featured;
    // Optimistic UI — flip immediately; revert on server failure.
    setItems((prev) =>
      prev.map((p) => (p._id === item._id ? { ...p, featured: nextFeatured } : p))
    );
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'exercises', id: item._id, featured: nextFeatured }),
      });
      if (!res.ok) {
        setItems((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, featured: item.featured } : p))
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((p) => (p._id === item._id ? { ...p, featured: item.featured } : p))
      );
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/content?type=${tab}&id=${confirmDelete._id}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setItems((p) => p.filter((i) => i._id !== confirmDelete._id));
        setTotal((t) => Math.max(0, t - 1));
      }
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        Admin
      </Link>

      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          admin · moderation
        </p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Content moderation
          </h1>
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {total.toLocaleString()} total
          </span>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-1 rounded-2xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-150',
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Shield className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No content to moderate.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item._id}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-colors duration-150 hover:border-foreground/10"
            >
              <UserAvatar src={item.author?.avatar} name={item.author?.name} size="sm" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">{item.author?.name ?? '—'}</span>
                  {item.author?.role && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {item.author.role}
                    </span>
                  )}
                  {item.createdAt && (
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  {item.exercise && (
                    <Link
                      href={`/exercises/${item.exercise._id}` as `/exercises/${string}`}
                      className="cursor-pointer truncate text-muted-foreground hover:text-foreground"
                    >
                      ↳ {item.exercise.title}
                    </Link>
                  )}
                </div>
                {item.title && (
                  <p className="font-medium text-foreground">
                    <Link
                      href={`/exercises/${item._id}` as `/exercises/${string}`}
                      className="cursor-pointer hover:text-primary"
                    >
                      <bdi>{item.title}</bdi>
                    </Link>
                  </p>
                )}
                {(item.description || item.content) && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.description ?? item.content}
                  </p>
                )}
                {tab === 'exercises' && (
                  <div className="flex gap-3 pt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                    <span>♥ {item.likesCount ?? 0}</span>
                    <span>💬 {item.commentsCount ?? 0}</span>
                    <span>✓ {item.solutionCount ?? 0}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {tab === 'exercises' && (
                  <Button
                    intent={item.featured ? 'primary-blue' : 'secondary-blue'}
                    size="mobile"
                    className="cursor-pointer gap-1.5"
                    onClick={() => toggleFeatured(item)}
                    aria-pressed={!!item.featured}
                    title={item.featured ? 'Unfeature' : 'Feature'}
                  >
                    <Star
                      className={cn(
                        'size-3.5',
                        item.featured && 'fill-current'
                      )}
                    />
                    {item.featured ? 'Featured' : 'Feature'}
                  </Button>
                )}
                <Button
                  intent="secondary-red"
                  size="mobile"
                  className="cursor-pointer gap-1.5"
                  onClick={() => setConfirmDelete(item)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-destructive">
              Delete this {tab.slice(0, -1)}?
            </DialogTitle>
            <DialogDescription>
              This action is permanent. The content will be removed for all users.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              className="cursor-pointer rounded-xl"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer gap-1.5 rounded-xl"
              disabled={busy}
              onClick={handleDelete}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
