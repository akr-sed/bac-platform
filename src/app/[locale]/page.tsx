'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { GraduationCap, BookOpen, Users, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';

export default function HomePage() {
  const t = useTranslations('common');
  const nav = useTranslations('navigation');
  const { user, loading } = useAuth();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="flex flex-col items-center text-center">
          {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            {/* <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-medium text-primary">Collaborative Learning Platform</span> */}
          {/* </div> */} 
          <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t('welcome')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Practice, share, and master your Baccalaureate exercises with a community of students and teachers.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/exercises"
              className={cn(buttonVariants({ size: 'lg' }), 'cursor-pointer gap-2 rounded-xl px-6')}
            >
              <BookOpen className="size-4" />
              {nav('exercises')}
            </Link>
            {!loading && !user && (
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'cursor-pointer gap-2 rounded-xl px-6')}
              >
                {nav('register')}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            )}
            {!loading && user && (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'cursor-pointer gap-2 rounded-xl px-6')}
              >
                Dashboard
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-16 sm:pb-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-xl border border-border p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardContent className="flex flex-col items-start gap-4 p-0">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold text-foreground">Browse Exercises</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Find exercises by subject, topic, and difficulty level. Filtered and organized for efficient study.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardContent className="flex flex-col items-start gap-4 p-0">
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary/10">
                <Users className="size-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold text-foreground">Community Solutions</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share your solutions, get feedback from peers and verified teachers, and learn from others.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border p-6 shadow-sm transition-shadow duration-200 hover:shadow-md sm:col-span-2 lg:col-span-1">
            <CardContent className="flex flex-col items-start gap-4 p-0">
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10">
                <Trophy className="size-6 text-accent" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold text-foreground">Earn Reputation</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gain points for posting exercises and solutions. Climb the ranks from Beginner to Expert.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pb-16 sm:pb-24">
        <Card className="rounded-xl border border-border bg-primary/5 p-8 shadow-sm">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <GraduationCap className="mb-3 size-8 text-primary" />
                <p className="font-heading text-3xl font-bold text-foreground">1,200+</p>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <BookOpen className="mb-3 size-8 text-primary" />
                <p className="font-heading text-3xl font-bold text-foreground">3,500+</p>
                <p className="text-sm text-muted-foreground">Exercises</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="mb-3 size-8 text-primary" />
                <p className="font-heading text-3xl font-bold text-foreground">8,900+</p>
                <p className="text-sm text-muted-foreground">Solutions Shared</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
