import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { connectToDatabase } from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Exercise from '@/models/Exercise';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar } from 'lucide-react';

interface ExamRow {
  _id: string;
  title: string;
  year: number;
  subject: string;
  level: string;
  exerciseCount: number;
  createdAt: string;
}

async function loadExams(): Promise<ExamRow[]> {
  await connectToDatabase();
  const exams = await Exam.find({})
    .select('title year subject level createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (exams.length === 0) return [];

  // One round-trip to count exercises per exam — cheaper than N+1.
  const counts = await Exercise.aggregate<{ _id: unknown; count: number }>([
    { $match: { examId: { $in: exams.map((e) => e._id) } } },
    { $group: { _id: '$examId', count: { $sum: 1 } } },
  ]);
  const countByExam = new Map(counts.map((c) => [String(c._id), c.count]));

  return exams.map((e) => ({
    _id: String(e._id),
    title: e.title,
    year: e.year,
    subject: e.subject,
    level: e.level,
    exerciseCount: countByExam.get(String(e._id)) ?? 0,
    createdAt:
      e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
  }));
}

export default async function ExamsIndexPage() {
  const t = await getTranslations('exam');
  const exams = await loadExams();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('headerLabel')}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          {t('indexTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('indexSubtitle')}
        </p>
      </header>

      {exams.length === 0 ? (
        <Card className="rounded-xl border border-border p-8 text-center shadow-sm">
          <CardContent className="p-0 text-sm text-muted-foreground">
            {t('indexEmpty')}
          </CardContent>
        </Card>
      ) : (
        <ol className="space-y-3">
          {exams.map((exam) => (
            <li key={exam._id}>
              <Link
                href={`/exams/${exam._id}` as `/exams/${string}`}
                className="group block"
              >
                <Card className="rounded-xl border border-border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <CardContent className="flex items-start justify-between gap-4 p-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        <bdi>{exam.year}</bdi>
                      </p>
                      <p className="mt-1 truncate font-medium text-foreground">
                        <bdi>{exam.title}</bdi>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {exam.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {exam.level}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" aria-hidden="true" />
                          {t('exerciseCount', { count: exam.exerciseCount })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
