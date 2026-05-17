import { getTranslations } from 'next-intl/server';
import { Types } from 'mongoose';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import Exam from '@/models/Exam';
import { LibraryCard } from '@/components/exercises/library-card';
import { LibraryFilterBar } from '@/components/exercises/library-filter-bar';
import { LibraryTypeCards } from '@/components/exercises/library-type-cards';
import { LibraryYearChips } from '@/components/exercises/library-year-chips';
import { LibraryTopicChips } from '@/components/exercises/library-topic-chips';
import { LibraryDifficultyChips } from '@/components/exercises/library-difficulty-chips';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ExamTopicLocale } from '@/lib/exam-topic-labels';
import { AppShell } from '@/components/layout/AppShell';
import { FILIERE_KEYS } from '@/lib/filiere';
import { cloudinaryTransform } from '@/lib/cloudinary';

type RouteParams = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SourceType = 'bac' | 'bac_blanc' | 'external';
type Difficulty = 'easy' | 'medium' | 'hard';

interface LibraryItem {
  _id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  examNumber?: number;
  topic?: string;
  marks?: number;
  concepts?: string[];
  hasMath?: boolean;
  examLabel?: string;
  partsCount?: number;
  previewFigure?: { url: string; alt: string } | null;
}

function getString(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

// ── Hub counts ─────────────────────────────────────────────────────────────
async function loadHubCounts(filiere?: string): Promise<{
  bac: number;
  bac_blanc: number;
  external: number;
}> {
  await connectToDatabase();

  const allExams = await Exam.find({}).select('_id examType').lean();
  const examIdsByType = new Map<string, Types.ObjectId[]>();
  for (const e of allExams) {
    const t = e.examType ?? 'bac';
    if (!examIdsByType.has(t)) examIdsByType.set(t, []);
    examIdsByType.get(t)!.push(e._id as Types.ObjectId);
  }

  const baseExerciseFilter: Record<string, unknown> = {};
  if (filiere && (FILIERE_KEYS as readonly string[]).includes(filiere)) {
    baseExerciseFilter.filiere = filiere;
  }

  const bacIds = examIdsByType.get('bac') ?? [];
  const bacBlancIds = examIdsByType.get('bac_blanc') ?? [];

  const [bacCount, bacBlancCount, externalCount] = await Promise.all([
    bacIds.length
      ? Exercise.countDocuments({ ...baseExerciseFilter, examId: { $in: bacIds } })
      : Promise.resolve(0),
    bacBlancIds.length
      ? Exercise.countDocuments({ ...baseExerciseFilter, examId: { $in: bacBlancIds } })
      : Promise.resolve(0),
    Exercise.countDocuments({ ...baseExerciseFilter, examId: { $exists: false } }),
  ]);

  return { bac: bacCount, bac_blanc: bacBlancCount, external: externalCount };
}

// ── Filtered (typed) list ──────────────────────────────────────────────────
async function loadFilteredLibrary(opts: {
  type: SourceType;
  year?: number;
  filiere?: string;
  topic?: string;
  difficulty?: Difficulty;
}): Promise<{
  items: LibraryItem[];
  availableYears: number[];
  availableTopics: string[];
}> {
  await connectToDatabase();
  const { type, year, filiere, topic, difficulty } = opts;

  // Filters that apply to BOTH the listed items AND the chip-availability
  // queries (so the topic chips show every topic that's reachable from the
  // current type+year+filière, even when the user has selected one).
  const scopeExerciseFilter: Record<string, unknown> = {};
  if (filiere && (FILIERE_KEYS as readonly string[]).includes(filiere)) {
    scopeExerciseFilter.filiere = filiere;
  }

  let availableYears: number[] = [];

  if (type === 'external') {
    scopeExerciseFilter.examId = { $exists: false };
  } else {
    const examFilter: Record<string, unknown> = { examType: type };
    const allTypeExams = await Exam.find(examFilter).select('year _id').lean();
    availableYears = Array.from(
      new Set(allTypeExams.map((e) => e.year).filter((y): y is number => Number.isFinite(y)))
    );

    const yearFilteredExamIds = year
      ? allTypeExams.filter((e) => e.year === year).map((e) => e._id as Types.ObjectId)
      : allTypeExams.map((e) => e._id as Types.ObjectId);
    scopeExerciseFilter.examId = { $in: yearFilteredExamIds };
    if (yearFilteredExamIds.length === 0) {
      return { items: [], availableYears, availableTopics: [] };
    }
  }

  // Available topics: distinct values within the current type+year+filière
  // scope BEFORE applying the topic/difficulty filter. Lets the user switch
  // freely between topics without chips disappearing.
  const availableTopics = (await Exercise.distinct('topic', scopeExerciseFilter)).filter(
    (t): t is string => typeof t === 'string' && t.length > 0
  );

  // Now layer on the topic + difficulty filters for the actual results.
  const itemsFilter: Record<string, unknown> = { ...scopeExerciseFilter };
  if (topic) itemsFilter.topic = topic;
  if (difficulty) itemsFilter.difficulty = difficulty;

  const exercises = await Exercise.find(itemsFilter)
    .select(
      'title description difficulty examId examNumber topic marks concepts hasMath sourcePage parts figures'
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

  const exams = examIds.length
    ? await Exam.find({ _id: { $in: examIds } }).select('year subject level title examType').lean()
    : [];
  const examMap = new Map(exams.map((e) => [String(e._id), e]));

  const items: LibraryItem[] = exercises.map((ex) => {
    const exam = ex.examId ? examMap.get(String(ex.examId)) : null;
    const examLabel = exam ? `BAC ${exam.year} · ${exam.subject}` : undefined;
    const firstQuestionFigure = ex.figures?.find((f) => f.context === 'question');
    const previewFigure = firstQuestionFigure
      ? {
          url: cloudinaryTransform(
            firstQuestionFigure.cloudinaryUrl,
            'c_fill,w_640,h_400,q_auto,f_auto'
          ),
          alt: firstQuestionFigure.description || ex.title,
        }
      : null;
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
      partsCount: ex.parts?.length ?? 0,
      previewFigure,
    };
  });

  return { items, availableYears, availableTopics };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function LibraryPage({ params, searchParams }: RouteParams) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  const filiere = getString(sp, 'filiere');
  const typeParam = getString(sp, 'type');
  const yearParam = getString(sp, 'year');
  const topicParam = getString(sp, 'topic');
  const difficultyParam = getString(sp, 'difficulty');
  const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : undefined;
  const difficulty: Difficulty | undefined =
    difficultyParam === 'easy' || difficultyParam === 'medium' || difficultyParam === 'hard'
      ? difficultyParam
      : undefined;

  const validTypes: SourceType[] = ['bac', 'bac_blanc', 'external'];
  const type =
    typeParam && (validTypes as string[]).includes(typeParam) ? (typeParam as SourceType) : null;

  const t = await getTranslations('library');
  const tHub = await getTranslations('library.hub');
  const topicLocale: ExamTopicLocale =
    locale === 'fr' || locale === 'en' || locale === 'ar' ? locale : 'ar';

  // ── Hub view ─────────────────────────────────────────────────────────────
  if (!type) {
    const counts = await loadHubCounts(filiere);
    return (
      <AppShell>
        <div className="py-8">
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

          <div className="space-y-8">
            <LibraryFilterBar filiere={filiere ?? ''} />
            <LibraryTypeCards counts={counts} currentFiliere={filiere} />
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Filtered view ────────────────────────────────────────────────────────
  const { items, availableYears, availableTopics } = await loadFilteredLibrary({
    type,
    year,
    filiere,
    topic: topicParam,
    difficulty,
  });

  const tTypes = await getTranslations('library.types');

  return (
    <AppShell>
      <div className="py-8">
        <Link
          href={`/library${filiere ? `?filiere=${filiere}` : ''}` as never}
          className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {tHub('backToHub')}
        </Link>

        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('eyebrow')}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {tTypes(type)}
          </h1>
        </header>

        <div className="space-y-6">
          {/* Filter toolbar: filière + year + topic + difficulty share the same chip language */}
          <div className="space-y-3 rounded-2xl border border-border bg-card/50 p-4">
            <LibraryFilterBar
              filiere={filiere ?? ''}
              type={type}
              year={year}
              topic={topicParam}
              difficulty={difficulty}
            />
            {availableYears.length > 0 && (
              <LibraryYearChips
                years={availableYears}
                selectedYear={year ?? null}
                type={type}
                filiere={filiere}
                topic={topicParam}
                difficulty={difficulty}
              />
            )}
            {availableTopics.length > 0 && (
              <LibraryTopicChips
                topics={availableTopics}
                selected={topicParam ?? null}
                locale={topicLocale}
                type={type}
                year={year}
                filiere={filiere}
                difficulty={difficulty}
              />
            )}
            <LibraryDifficultyChips
              selected={difficulty ?? null}
              type={type}
              year={year}
              filiere={filiere}
              topic={topicParam}
            />
          </div>

          <div>
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
