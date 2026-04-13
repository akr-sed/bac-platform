'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Flag, CheckCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Report {
  _id: string;
  targetUser?: { _id: string; name: string };
  reporter?: { name: string };
  reason: string;
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: string;
}

export default function AdminReportsPage() {
  const t = useTranslations('admin');

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReports(data.reports ?? data ?? []);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (reportId: string) => {
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId ? { ...r, status: 'resolved' as const } : r
        )
      );
    } catch {
      /* handle error */
    }
  };

  const handleEscalate = async (reportId: string) => {
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'escalated' }),
      });
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId ? { ...r, status: 'escalated' as const } : r
        )
      );
    } catch {
      /* handle error */
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs">Resolved</Badge>;
      case 'escalated':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 text-xs">Escalated</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 text-xs">Pending</Badge>;
    }
  };

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
        <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
          <Flag className="size-5 text-destructive" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {t('reports')} Queue
        </h1>
      </div>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <CheckCircle className="mb-3 size-12 text-ai-accent" />
              <p className="text-lg font-medium text-foreground">No reports</p>
              <p className="text-sm text-muted-foreground">The reports queue is empty.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell className="font-medium">
                      {report.targetUser ? (
                        <Link
                          href={`/profile/${report.targetUser._id}`}
                          className="cursor-pointer text-foreground hover:text-primary"
                        >
                          {report.targetUser.name}
                        </Link>
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {report.reporter?.name ?? 'Anonymous'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {report.reason}
                    </TableCell>
                    <TableCell>{statusBadge(report.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {report.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer gap-1"
                            onClick={() => handleResolve(report._id)}
                          >
                            <CheckCircle className="size-3.5 text-ai-accent" />
                            Resolve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer gap-1 text-amber-600"
                            onClick={() => handleEscalate(report._id)}
                          >
                            <ArrowUpRight className="size-3.5" />
                            Escalate
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
