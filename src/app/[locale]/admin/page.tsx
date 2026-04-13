'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  Users,
  BookOpen,
  MessageCircle,
  Flag,
  ArrowRight,
  Shield,
  FolderTree,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminStats {
  totalUsers: number;
  totalExercises: number;
  totalSolutions: number;
  pendingReports: number;
}

export default function AdminPage() {
  const t = useTranslations('admin');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setStats(await res.json());
      })
      .catch(() => {
        setStats({
          totalUsers: 0,
          totalExercises: 0,
          totalSolutions: 0,
          pendingReports: 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: t('totalUsers'),
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: t('totalExercises'),
      value: stats?.totalExercises ?? 0,
      icon: BookOpen,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: t('solutions'),
      value: stats?.totalSolutions ?? 0,
      icon: MessageCircle,
      color: 'text-ai-accent',
      bg: 'bg-ai-accent/10',
    },
    {
      label: t('pendingReports'),
      value: stats?.pendingReports ?? 0,
      icon: Flag,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  const adminLinks = [
    {
      href: '/admin/users' as const,
      label: t('users'),
      description: 'Manage user accounts, verify teachers',
      icon: Users,
    },
    {
      href: '/admin/moderation' as const,
      label: 'Moderation',
      description: 'Review reported content',
      icon: Shield,
    },
    {
      href: '/admin/reports' as const,
      label: t('reports'),
      description: 'Handle flagged users and escalations',
      icon: Flag,
    },
    {
      href: '/admin/categories' as const,
      label: 'Categories',
      description: 'Manage subjects, topics, subtopics',
      icon: FolderTree,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight text-foreground">
        {t('title')}
      </h1>

      {/* Stats grid */}
      {loading ? (
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-border p-6">
              <Skeleton className="mb-2 h-4 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label} className="rounded-xl border border-border p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-0">
                <div className={`flex size-12 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`size-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                    {s.value.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick links */}
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
        Management
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="group cursor-pointer rounded-xl border border-border p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="flex items-center justify-between p-0">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <link.icon className="size-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{link.label}</p>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
