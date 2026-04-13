'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExerciseDTO } from '@/types';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
} as const;

interface ExerciseCardProps {
  exercise: ExerciseDTO;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const t = useTranslations('exercises');

  return (
    <Link href={`/exercises/${exercise._id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{exercise.subject}</Badge>
            <Badge variant="outline">{exercise.topic}</Badge>
            <Badge className={difficultyColors[exercise.difficulty]}>
              {t(`difficulty.${exercise.difficulty}`)}
            </Badge>
          </div>
          <CardTitle className="mt-2">{exercise.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {exercise.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{exercise.author?.name}</span>
            <span>
              {exercise.solutionCount}{' '}
              {t('detail.solutions').toLowerCase()}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <span className="text-xs text-muted-foreground">
            {new Date(exercise.createdAt).toLocaleDateString()}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
