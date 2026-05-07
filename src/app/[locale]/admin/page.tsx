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
  Upload,
  ShieldAlert,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalExercises: number;
  totalSolutions: number;
  pendingReports: number;
}

export default function AdminPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setStats(await res.json());
      })
      .catch(() =>
        setStats({
          totalUsers: 0,
          totalExercises: 0,
          totalSolutions: 0,
          pendingReports: 0,
        })
      );
  }, []);

  const statCards = [
    { label: t('totalUsers'), value: stats?.totalUsers, icon: Users },
    { label: t('totalExercises'), value: stats?.totalExercises, icon: BookOpen },
    { label: t('solutions'), value: stats?.totalSolutions, icon: MessageCircle },
    { label: t('pendingReports'), value: stats?.pendingReports, icon: Flag },
  ];

  const adminLinks = [
    {
      href: '/admin/users' as const,
      label: t('users'),
      description: 'Manage user accounts, verify teachers, block abusers.',
      icon: Users,
    },
    {
      href: '/admin/moderation' as const,
      label: 'Content moderation',
      description: 'Review and remove exercises, solutions, comments.',
      icon: Shield,
    },
    {
      href: '/admin/reports' as const,
      label: t('reports'),
      description: 'Handle flagged users and escalations.',
      icon: ShieldAlert,
    },
    {
      href: '/admin/categories' as const,
      label: 'Categories',
      description: 'Manage subjects, topics, subtopics.',
      icon: FolderTree,
    },
    {
      href: '/admin/import-exam' as const,
      label: t('importExam.title'),
      description: t('importExam.subtitle'),
      icon: Upload,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Najah · admin
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
          {t('title')}
        </h1>
      </header>

      {/* Stats — no card chrome, just dividers */}
      <div className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <s.icon className="size-3.5 text-primary" />
              {s.label}
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-foreground">
              {s.value === undefined ? '—' : s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links — single column, asymmetric, no 3-card slop */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Management
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary">
                <link.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        ))}
      </div>
    </main>
  );
}
