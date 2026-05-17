import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MathText } from '@/components/ui/math-text';
import { ArrowRight, BookOpen, ListOrdered } from 'lucide-react';
import { resolveExerciseTitle } from '@/lib/resolve-exercise-title';
import { topicLabel, type ExamTopicLocale } from '@/lib/exam-topic-labels';

interface Props {
  exercise: {
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
    partsCount?: number;
    previewFigure?: { url: string; alt: string } | null;
  };
  locale: ExamTopicLocale;
}

const PREVIEW_CHARS = 280;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export function LibraryCard({ exercise, locale }: Props) {
  const title = resolveExerciseTitle(exercise, locale);
  const localizedTopic = exercise.topic
    ? topicLabel(exercise.topic, locale)
    : null;
  const hasThumbnail = Boolean(exercise.previewFigure?.url);
  const preview = truncate(exercise.description ?? '', PREVIEW_CHARS);

  return (
    <Link href={`/exercises/${exercise._id}`} className="group flex h-full">
      <Card className="flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]">
        {hasThumbnail && exercise.previewFigure && (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
            <Image
              src={exercise.previewFigure.url}
              alt={exercise.previewFigure.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        )}
        <CardContent className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex max-h-[1.75rem] flex-wrap items-center gap-2 overflow-hidden sm:max-h-none sm:overflow-visible">
              {exercise.examLabel && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
                >
                  <BookOpen className="size-3" />
                  {exercise.examLabel}
                </Badge>
              )}
              {localizedTopic && (
                <Badge variant="outline" className="rounded-full text-xs">
                  {localizedTopic}
                </Badge>
              )}
              {typeof exercise.marks === 'number' && (
                <Badge variant="outline" className="rounded-full font-mono tabular-nums text-xs">
                  {exercise.marks} pts
                </Badge>
              )}
              {typeof exercise.partsCount === 'number' && exercise.partsCount > 0 && (
                <Badge variant="outline" className="gap-1 rounded-full font-mono tabular-nums text-xs">
                  <ListOrdered className="size-3" />
                  {exercise.partsCount}
                </Badge>
              )}
            </div>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </div>

          <h3 className="line-clamp-2 min-h-[3.5rem] font-heading text-lg font-semibold leading-snug text-foreground">
            <bdi>{title}</bdi>
          </h3>

          {!hasThumbnail && (
            <div className="min-h-[5rem] text-sm leading-relaxed text-muted-foreground">
              <MathText className="line-clamp-4">{preview}</MathText>
            </div>
          )}

          <div className="flex-1" />

          {exercise.concepts && exercise.concepts.length > 0 && (
            <div className="flex max-h-[2rem] flex-wrap gap-1.5 overflow-hidden border-t border-border pt-3">
              {exercise.concepts.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {c.replace(/_/g, ' ')}
                </span>
              ))}
              {exercise.concepts.length > 3 && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{exercise.concepts.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
