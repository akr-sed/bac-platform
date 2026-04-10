'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { UserDTO } from '@/types';
import ProfileCard from '@/components/profile/ProfileCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileData {
  user: UserDTO;
  exerciseCount: number;
  solutionCount: number;
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-20 rounded-full bg-muted" />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted/50 p-4">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-2 h-7 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile/me');
        if (!res.ok) {
          throw new Error('Failed to load profile');
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <ProfileSkeleton />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <Card>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
        {t('title')}
      </h1>

      <ProfileCard
        user={data.user}
        exerciseCount={data.exerciseCount}
        solutionCount={data.solutionCount}
      />

      <div className="mt-8">
        <Tabs defaultValue="exercises">
          <TabsList>
            <TabsTrigger value="exercises">{t('exercises')}</TabsTrigger>
            <TabsTrigger value="solutions">{t('solutions')}</TabsTrigger>
          </TabsList>

          <TabsContent value="exercises">
            <Card className="mt-4">
              <CardContent>
                <p className="text-muted-foreground">
                  {data.exerciseCount > 0
                    ? `You have posted ${data.exerciseCount} exercise${data.exerciseCount !== 1 ? 's' : ''}.`
                    : 'You have not posted any exercises yet.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solutions">
            <Card className="mt-4">
              <CardContent>
                <p className="text-muted-foreground">
                  {data.solutionCount > 0
                    ? `You have submitted ${data.solutionCount} solution${data.solutionCount !== 1 ? 's' : ''}.`
                    : 'You have not submitted any solutions yet.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
