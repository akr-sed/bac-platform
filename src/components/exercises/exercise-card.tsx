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
    <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]">
      <header className="flex items-center gap-3 px-5 pt-5 pb-3">
        <UserAvatar src={exercise.author?.avatar} name={exercise.author?.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{exercise.author?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            <span className="capitalize">{exercise.subject}</span>
            <span className="mx-1.5">·</span>
            <time className="font-mono tabular-nums" dateTime={exercise.lastActivityAt}>{relativeTime(exercise.lastActivityAt)}</time>
          </p>
        </div>
        <DifficultyBadge level={exercise.difficulty} />
      </header>

      <Link href={`/exercises/${exercise._id}`} className="block">
        <h3 className="line-clamp-2 px-5 pb-4 font-heading text-lg font-semibold leading-snug tracking-tight text-foreground">
          <bdi>{localizedTitle}</bdi>
        </h3>

        <div className="relative mx-5 mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
          {preview.kind === 'image' && preview.url ? (
            <Image
              src={imageUrl(preview.url)}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
              placeholder={blurUrl(preview.url) ? 'blur' : 'empty'}
              blurDataURL={blurUrl(preview.url) ?? undefined}
            />
          ) : preview.kind === 'pdf' ? (
            <div className="flex h-full flex-col justify-between bg-gradient-to-br from-primary/10 via-muted to-primary/5 p-5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">PDF</span>
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{exercise.description}</p>
            </div>
          ) : (
            <div className="flex h-full items-end bg-gradient-to-b from-muted/50 to-muted p-5">
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{exercise.description}</p>
            </div>
          )}
        </div>
      </Link>

      <footer className="flex items-center gap-1 border-t border-border px-3 py-1.5">
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
          className="ms-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <MessageCircle className="size-4" />
          <span className="font-mono tabular-nums">{exercise.commentsCount}</span>
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
