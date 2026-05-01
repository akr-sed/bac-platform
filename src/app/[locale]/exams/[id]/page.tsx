import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Types } from 'mongoose';
import { Link } from '@/i18n/routing';
import { connectToDatabase } from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Exercise from '@/models/Exercise';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { topicLabel, type ExamTopicLocale } from '@/lib/exam-topic-labels';

type RouteParams = { params: Promise<{ id: string; locale: string }> };

interface ExerciseRow {
  _id: string;
  title: string;
  examNumber?: number;
  topic?: string;
  marks?: number;
  sourcePage?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface ExamView {
  _id: string;
  title: string;
  year: number;
  subject: string;
  level: string;
  exercisesByPage: { page: number; items: ExerciseRow[] }[];
  totalExercises: number;
}

async function loadExam(id: string): Promise<ExamView | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const exam = await Exam.findById(id).lean();
  if (!exam) return null;

  const exercises = await Exercise.find({ examId: exam._id })
    .select('title examNumber topic marks sourcePage difficulty')
    .sort({ sourcePage: 1, examNumber: 1, createdAt: 1 })
    .lean();

  const grouped = new Map<number, ExerciseRow[]>();
  for (const ex of exercises) {
    const page = typeof ex.sourcePage === 'number' ? ex.sourcePage : 0;
    if (!grouped.has(page)) grouped.set(page, []);
    grouped.get(page)!.push({
      _id: String(ex._id),
      title: ex.title,
      examNumber: ex.examNumber,
      topic: ex.topic,
      marks: ex.marks,
      sourcePage: ex.sourcePage,
      difficulty: ex.difficulty,
    });
  }

  const exercisesByPage = Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([page, items]) => ({ page, items }));

  return {
    _id: String(exam._id),
    title: exam.title,
    year: exam.year,
    subject: exam.subject,
    level: exam.level,
    exercisesByPage,
    totalExercises: exercises.length,
  };
}

export default async function ExamPage({ params }: RouteParams) {
  const { id, locale } = await params;
  const t = await getTranslations('exam');
  const topicLocale: ExamTopicLocale =
    locale === 'fr' || locale === 'en' || locale === 'ar' ? locale : 'ar';

  const exam = await loadExam(id);
  if (!exam) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          {t('headerLabel')}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {exam.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {t('year')}: {exam.year}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {t('subject')}: {exam.subject}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {t('level')}: {exam.level}
          </Badge>
          <span className="text-xs">
            {t('exerciseCount', { count: exam.totalExercises })}
          </span>
        </div>
      </header>

      {exam.exercisesByPage.length === 0 ? (
        <Card className="rounded-xl border border-border p-8 text-center shadow-sm">
          <CardContent className="p-0 text-sm text-muted-foreground">
            {t('noExercises')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {exam.exercisesByPage.map(({ page, items }) => (
            <section key={page}>
              <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
                {page > 0 ? t('pageHeading', { page }) : t('headerLabel')}
              </h2>

              <ol className="space-y-3">
                {items.map((ex) => {
                  const localizedTopic = ex.topic
                    ? topicLabel(ex.topic, topicLocale)
                    : '';
                  return (
                    <li key={ex._id}>
                      <Link
                        href={`/exercises/${ex._id}`}
                        className="group block"
                      >
                        <Card className="rounded-xl border border-border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                          <CardContent className="flex items-start justify-between gap-4 p-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {typeof ex.examNumber === 'number'
                                  ? t('exerciseLabel', { number: ex.examNumber })
                                  : null}
                              </p>
                              <p className="mt-1 truncate font-medium text-foreground">
                                {ex.title}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {localizedTopic && (
                                  <Badge variant="secondary" className="text-xs">
                                    {localizedTopic}
                                  </Badge>
                                )}
                                {typeof ex.marks === 'number' && (
                                  <Badge variant="outline" className="text-xs">
                                    {t('marks', { marks: ex.marks })}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
