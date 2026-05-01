import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MathText } from '@/components/ui/math-text';
import { ArrowRight, BookOpen } from 'lucide-react';
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
  const preview = truncate(exercise.description ?? '', PREVIEW_CHARS);

  return (
    <Link href={`/exercises/${exercise._id}`} className="group block">
      <Card className="rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
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
                <Badge variant="outline" className="rounded-full text-xs">
                  {exercise.marks} pts
                </Badge>
              )}
            </div>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </div>

          <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
            <bdi>{title}</bdi>
          </h3>

          <div className="text-sm leading-relaxed text-muted-foreground">
            {exercise.hasMath ? (
              <MathText className="line-clamp-4">{preview}</MathText>
            ) : (
              <p className="line-clamp-4">{preview}</p>
            )}
          </div>

          {exercise.concepts && exercise.concepts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
              {exercise.concepts.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {c.replace(/_/g, ' ')}
                </span>
              ))}
              {exercise.concepts.length > 4 && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{exercise.concepts.length - 4}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
