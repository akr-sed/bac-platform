'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  totalUsers: number;
  totalExercises: number;
  totalSolutions: number;
  pendingReports: number;
}

export default function StatsCards() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: t('totalUsers'), value: stats?.totalUsers ?? 0 },
    { label: t('totalExercises'), value: stats?.totalExercises ?? 0 },
    { label: t('totalSolutions'), value: stats?.totalSolutions ?? 0 },
    { label: t('pendingReports'), value: stats?.pendingReports ?? 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {loading ? '...' : card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
