'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft, CheckCircle, Search, Ban, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  avatar?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tRoles = useTranslations('roles');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [blockFor, setBlockFor] = useState<UserItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users?limit=50')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data ?? json.users ?? [];
        setUsers(list);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleVerify(userId: string) {
    setBusyId(userId);
    try {
      await fetch(`/api/admin/users/${userId}/verify`, { method: 'PATCH' });
      setUsers((p) => p.map((u) => (u._id === userId ? { ...u, isVerifiedTeacher: true } : u)));
    } finally {
      setBusyId(null);
    }
  }

  async function handleBlock() {
    if (!blockFor) return;
    setBusyId(blockFor._id);
    try {
      const res = await fetch(`/api/admin/users/${blockFor._id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason }),
      });
      if (res.ok) {
        setUsers((p) =>
          p.map((u) => (u._id === blockFor._id ? { ...u, isBlocked: true, blockedReason: blockReason } : u))
        );
      }
    } finally {
      setBusyId(null);
      setBlockFor(null);
      setBlockReason('');
    }
  }

  async function handleUnblock(userId: string) {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/block`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((p) => p.map((u) => (u._id === userId ? { ...u, isBlocked: false, blockedReason: undefined } : u)));
      }
    } finally {
      setBusyId(null);
    }
  }

  const filtered = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('title')}
      </Link>

      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          admin · users
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {t('users')}
        </h1>
      </header>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-2xl ps-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border">
        {loading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No users found.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((user) => (
              <li
                key={user._id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/30"
              >
                <UserAvatar src={user.avatar} name={user.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/profile/${user._id}` as `/profile/${string}`}
                      className="cursor-pointer font-medium text-foreground hover:text-primary"
                    >
                      {user.name}
                    </Link>
                    <RoleBadge
                      role={user.role}
                      isVerified={user.isVerifiedTeacher}
                      label={tRoles(user.role)}
                    />
                    {user.isBlocked && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                        <Ban className="size-3" />
                        Blocked
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{user.email}</span>
                    <span className="mx-2">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user.role === 'teacher' && !user.isVerifiedTeacher && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1.5 rounded-xl"
                      onClick={() => handleVerify(user._id)}
                      disabled={busyId === user._id}
                    >
                      <CheckCircle className="size-3.5 text-primary" />
                      {t('verifyTeacher')}
                    </Button>
                  )}
                  {user.isBlocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1.5 rounded-xl"
                      onClick={() => handleUnblock(user._id)}
                      disabled={busyId === user._id}
                    >
                      {busyId === user._id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                      Unblock
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer gap-1.5 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setBlockFor(user)}
                      disabled={busyId === user._id || user.role === 'admin'}
                    >
                      <Ban className="size-3.5" />
                      Block
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={blockFor !== null} onOpenChange={(o) => { if (!o) setBlockFor(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Block {blockFor?.name}?
            </DialogTitle>
            <DialogDescription>
              They will be unable to sign in. The reason is stored for the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <Label htmlFor="block-reason">Reason (optional)</Label>
            <Textarea
              id="block-reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              className="rounded-2xl"
              placeholder="Why are you blocking this user?"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              className="cursor-pointer rounded-xl"
              onClick={() => setBlockFor(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer gap-1.5 rounded-xl"
              onClick={handleBlock}
              disabled={busyId !== null}
            >
              {busyId !== null && <Loader2 className="size-3.5 animate-spin" />}
              <Ban className="size-3.5" />
              Block user
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
