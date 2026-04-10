'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCards from '@/components/admin/StatsCards';
import UserTable from '@/components/admin/UserTable';
import ReportTable from '@/components/admin/ReportTable';

export default function AdminPage() {
  const t = useTranslations('admin');

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {t('title')}
      </h1>

      <div className="mt-8">
        <StatsCards />
      </div>

      <div className="mt-8">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">{t('users')}</TabsTrigger>
            <TabsTrigger value="reports">{t('reports')}</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UserTable />
          </TabsContent>
          <TabsContent value="reports" className="mt-4">
            <ReportTable />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
