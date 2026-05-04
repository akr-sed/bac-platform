import { getTranslations } from 'next-intl/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import Exam from '@/models/Exam';
import { LibraryCard } from '@/components/exercises/library-card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ExamTopicLocale } from '@/lib/exam-topic-labels';

type RouteParams = { params: Promise<{ locale: string }> };

interface LibraryItem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examNumber?: number;
  topic?: string;
  marks?: number;
  concepts?: string[];
  hasMath?: boolean;
  examLabel?: string;
}

async function loadLibrary(): Promise<LibraryItem[]> {
  await connectToDatabase();
  const exercises = await Exercise.find({ examId: { $exists: true } })
    .select(
      'title description difficulty examId examNumber topic marks concepts hasMath sourcePage'
    )
    .sort({ createdAt: -1, examNumber: 1 })
    .limit(60)
    .lean();

  const examIds = Array.from(
    new Set(
      exercises
        .map((e) => (e.examId ? String(e.examId) : null))
        .filter((id): id is string => id !== null)
    )
  ).map((id) => new Types.ObjectId(id));

  const exams = await Exam.find({ _id: { $in: examIds } })
    .select('year subject level title')
    .lean();
  const examMap = new Map(exams.map((e) => [String(e._id), e]));

  return exercises.map((ex) => {
    const exam = ex.examId ? examMap.get(String(ex.examId)) : null;
    const examLabel = exam ? `BAC ${exam.year} · ${exam.subject}` : undefined;
    return {
      _id: String(ex._id),
      title: ex.title,
      description: ex.description,
      difficulty: ex.difficulty,
      examNumber: ex.examNumber,
      topic: ex.topic,
      marks: ex.marks,
      concepts: ex.concepts,
      hasMath: ex.hasMath,
      examLabel,
    };
  });
}

export default async function LibraryPage({ params }: RouteParams) {
  const { locale } = await params;
  const t = await getTranslations('library');
  const topicLocale: ExamTopicLocale =
    locale === 'fr' || locale === 'en' || locale === 'ar' ? locale : 'ar';

  const items = await loadLibrary();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          variant="empty-saved"
          title={t('empty')}
          description={t('subtitle')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((ex) => (
            <LibraryCard key={ex._id} exercise={ex} locale={topicLocale} />
          ))}
        </div>
      )}
    </main>
  );
}
