'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Users, CheckCircle, Flag, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleBadge } from '@/components/ui/role-badge';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
  status?: 'active' | 'flagged' | 'banned';
  createdAt: string;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tRoles = useTranslations('roles');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUsers(data.users ?? data ?? []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/verify`, { method: 'PATCH' });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isVerifiedTeacher: true } : u
        )
      );
    } catch {
      /* handle error */
    }
  };

  const handleFlag = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/flag`, { method: 'PATCH' });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, status: 'flagged' as const } : u
        )
      );
    } catch {
      /* handle error */
    }
  };

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('title')}
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="size-5 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {t('users')}
        </h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>
      </div>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="size-4 text-primary" />
                          </div>
                          <Link
                            href={`/profile/${user._id}`}
                            className="cursor-pointer font-medium text-foreground hover:text-primary"
                          >
                            {user.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <RoleBadge
                          role={user.role}
                          isVerified={user.isVerifiedTeacher}
                          label={tRoles(user.role)}
                        />
                      </TableCell>
                      <TableCell>
                        {user.status === 'flagged' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                            <Flag className="size-3" />
                            Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-ai-accent font-medium">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {user.role === 'teacher' && !user.isVerifiedTeacher && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer gap-1"
                              onClick={() => handleVerify(user._id)}
                            >
                              <CheckCircle className="size-3.5 text-ai-accent" />
                              {t('verifyTeacher')}
                            </Button>
                          )}
                          {user.status !== 'flagged' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer gap-1 text-destructive hover:text-destructive"
                              onClick={() => handleFlag(user._id)}
                            >
                              <Flag className="size-3.5" />
                              Flag
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
