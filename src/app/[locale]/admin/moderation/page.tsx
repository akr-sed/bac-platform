'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Trash2, CheckCircle, Flag } from 'lucide-react';
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

interface ReportedContent {
  _id: string;
  contentType: 'exercise' | 'solution' | 'comment';
  contentId: string;
  contentTitle?: string;
  author?: { name: string };
  reporter?: { name: string };
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export default function ModerationPage() {
  const t = useTranslations('admin');
  const tMod = useTranslations('moderation');

  const [reports, setReports] = useState<ReportedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports?status=pending')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReports(data.reports ?? data ?? []);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (reportId: string, action: 'delete' | 'dismiss') => {
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch {
      /* handle error */
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
          Content Moderation
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
              <p className="text-lg font-medium text-foreground">All clear</p>
              <p className="text-sm text-muted-foreground">No pending reports to review.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {report.contentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {report.contentTitle ?? report.contentId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {report.author?.name ?? 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {report.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="cursor-pointer gap-1"
                          onClick={() => handleAction(report._id, 'delete')}
                        >
                          <Trash2 className="size-3.5" />
                          {tMod('delete')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer gap-1"
                          onClick={() => handleAction(report._id, 'dismiss')}
                        >
                          <CheckCircle className="size-3.5" />
                          Dismiss
                        </Button>
                      </div>
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
