import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { MessageCircle, FileText } from 'lucide-react';
import { firstPreview, imageUrl, blurUrl } from '@/lib/cloudinary-preview';
import { resolveExerciseTitle } from '@/lib/resolve-exercise-title';
import { LikeButton } from './like-button';
import { SaveButton } from './save-button';
import type { FeedItemDTO } from '@/types';

interface Props {
  exercise: FeedItemDTO;
  variant?: 'feed' | 'compact';
}

export function ExerciseCard({ exercise, variant: _variant = 'feed' }: Props) {
  const preview = firstPreview(exercise.attachments);
  const locale = useLocale();
  const localizedTitle = resolveExerciseTitle(exercise, locale);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <header className="flex items-center gap-3 p-4">
        <UserAvatar src={exercise.author?.avatar} name={exercise.author?.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{exercise.author?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {exercise.subject} · <time dateTime={exercise.lastActivityAt}>{relativeTime(exercise.lastActivityAt)}</time>
          </p>
        </div>
        <DifficultyBadge level={exercise.difficulty} />
      </header>

      <Link href={`/exercises/${exercise._id}`} className="block">
        <h3 className="line-clamp-2 px-4 pb-3 font-heading text-lg font-semibold">
          <bdi>{localizedTitle}</bdi>
        </h3>

        <div className="relative mx-4 mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-muted">
          {preview.kind === 'image' && preview.url ? (
            <Image
              src={imageUrl(preview.url)}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              loading="lazy"
              placeholder={blurUrl(preview.url) ? 'blur' : 'empty'}
              blurDataURL={blurUrl(preview.url) ?? undefined}
            />
          ) : preview.kind === 'pdf' ? (
            <div className="flex h-full flex-col justify-between bg-gradient-to-br from-primary/10 via-muted to-secondary/10 p-4">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">PDF</span>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{exercise.description}</p>
            </div>
          ) : (
            <div className="flex h-full items-end bg-gradient-to-b from-muted to-muted-foreground/10 p-4">
              <p className="line-clamp-3 text-sm text-muted-foreground">{exercise.description}</p>
            </div>
          )}
        </div>
      </Link>

      <footer className="flex items-center gap-1 border-t border-border px-2 py-1">
        <LikeButton
          exerciseId={exercise._id}
          initialLiked={exercise.isLiked ?? false}
          initialCount={exercise.likesCount}
        />
        <SaveButton
          exerciseId={exercise._id}
          initialSaved={exercise.isSaved ?? false}
        />
        <Link
          href={`/exercises/${exercise._id}#solutions`}
          className="ms-auto flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          <MessageCircle className="size-4" />
          {exercise.commentsCount}
        </Link>
      </footer>
    </article>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
