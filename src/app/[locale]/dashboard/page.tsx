'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  BookOpen,
  Plus,
  User,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsPill } from '@/components/ui/points-pill';
import { useAuth } from '@/components/providers/AuthProvider';

interface DashboardData {
  user: {
    _id: string;
    name: string;
    points: number;
    role: string;
    isVerifiedTeacher: boolean;
  };
  stats: {
    exercisesPosted: number;
    solutionsSubmitted: number;
    commentsCount: number;
    likesReceived: number;
  };
}

export default function DashboardPage() {
  const tNav = useTranslations('navigation');
  const { user: authUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setData(await res.json());
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const name = data?.user.name ?? authUser?.name ?? 'Student';
  const points = data?.user.points ?? authUser?.points ?? 0;

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="mb-3 h-10 w-72" />
        <Skeleton className="mb-12 h-5 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Greeting */}
      <div className="mb-12">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Hello, {name}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <PointsPill count={points} />
          <span className="text-sm text-muted-foreground">
            {(data?.stats.exercisesPosted ?? 0)} exercises &middot; {(data?.stats.solutionsSubmitted ?? 0)} solutions
          </span>
        </div>
      </div>

      {/* Action links — clean, spacious, editorial */}
      <nav className="space-y-3">
        <Link
          href="/exercises/new"
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-200 group-hover:bg-primary/20">
              <Plus className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Post an Exercise</p>
              <p className="text-sm text-muted-foreground">Share a problem with the community</p>
            </div>
          </div>
          <ArrowRight className="size-5 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </Link>

        <Link
          href="/exercises"
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-secondary/30 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-secondary/10 transition-colors duration-200 group-hover:bg-secondary/20">
              <Compass className="size-5 text-secondary" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Browse Exercises</p>
              <p className="text-sm text-muted-foreground">Find problems by subject and difficulty</p>
            </div>
          </div>
          <ArrowRight className="size-5 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-secondary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </Link>

        <Link
          href="/profile"
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-accent/30 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent/10 transition-colors duration-200 group-hover:bg-accent/20">
              <User className="size-5 text-accent" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Your Profile</p>
              <p className="text-sm text-muted-foreground">View your exercises and solutions</p>
            </div>
          </div>
          <ArrowRight className="size-5 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </Link>
      </nav>

      {/* Subtle footer link */}
      <div className="mt-12 text-center">
        <Link
          href="/exercises"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'cursor-pointer gap-2 text-muted-foreground')}
        >
          <BookOpen className="size-4" />
          {tNav('exercises')}
        </Link>
      </div>
    </main>
  );
}
