import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';
import { MessageCircle, ChevronRight, ThumbsUp, Star } from 'lucide-react';
import { imageUrl, blurUrl, firstPreview } from '@/lib/cloudinary-preview';
import { resolveExerciseTitle } from '@/lib/resolve-exercise-title';
import { LikeButton } from './like-button';
import { SaveButton } from './save-button';
import { ReportKebab } from './report-kebab';
import ReputationBadge from '@/components/profile/ReputationBadge';
import { cn } from '@/lib/utils';
import type { FeedItemDTO } from '@/types';

interface Props {
  exercise: FeedItemDTO;
  variant?: 'feed' | 'compact';
}

// Subject badge colour map (Wave 6)
const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  math:      { bg: 'bg-[#7ECCFE]', text: 'text-[#00709D]' },
  رياضيات:  { bg: 'bg-[#7ECCFE]', text: 'text-[#00709D]' },
  physics:   { bg: 'bg-[#FFDCBF]', text: 'text-[#6B3B00]' },
  فيزياء:   { bg: 'bg-[#FFDCBF]', text: 'text-[#6B3B00]' },
  chemistry: { bg: 'bg-[#D9EFF8]', text: 'text-[#0095D1]' },
  كيمياء:   { bg: 'bg-[#D9EFF8]', text: 'text-[#0095D1]' },
  biology:   { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
  'علوم طبيعية': { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
};

function subjectBadgeClass(subject: string) {
  const key = subject.toLowerCase();
  const match = SUBJECT_COLORS[key] ?? { bg: 'bg-[#EAEEF3]', text: 'text-[#3E4850]' };
  return `${match.bg} ${match.text}`;
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

export function ExerciseCard({ exercise, variant: _variant = 'feed' }: Props) {
  const locale = useLocale();
  const t = useTranslations('gamification');
  const localizedTitle = resolveExerciseTitle(exercise, locale);
  const preview = firstPreview(exercise.attachments);

  return (
    <article className="overflow-hidden rounded-[12px] border border-[#D9EFF8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-3 border-b border-[#D9EFF8] px-5 pt-5 pb-[21px]">
        {/* Subject badge + (optional) featured badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-bold capitalize',
              subjectBadgeClass(exercise.subject)
            )}
          >
            {exercise.subject}
          </span>
          {exercise.featured && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-[#FFF3CD] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8A6D00]"
              title={t('featured')}
            >
              <Star className="size-3 fill-current" />
              {t('featured')}
            </span>
          )}
        </div>

        {/* Author meta + avatar + report kebab.
            Author chip routes to the profile page; date and report kebab are
            siblings (outside the Link) so they don't compete for the tap. */}
        <div className="flex items-center gap-2">
          {exercise.author?._id ? (
            <Link
              href={`/profile/${exercise.author._id}` as `/profile/${string}`}
              className="group/author flex items-center gap-2 rounded-md transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0095D1]"
            >
              <div className="flex flex-col items-end text-end">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-[#171C20] group-hover/author:underline">
                    {exercise.author?.name ?? '—'}
                  </p>
                  {typeof exercise.author?.points === 'number' && (
                    <ReputationBadge points={exercise.author.points} />
                  )}
                </div>
              </div>
              <UserAvatar
                src={exercise.author?.avatar}
                name={exercise.author?.name}
                size="sm"
              />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end text-end">
                <p className="text-sm font-semibold text-[#171C20]">
                  {exercise.author?.name ?? '—'}
                </p>
              </div>
              <UserAvatar
                src={exercise.author?.avatar}
                name={exercise.author?.name}
                size="sm"
              />
            </div>
          )}
          <time
            className="text-xs text-[#3E4850]"
            dateTime={exercise.lastActivityAt}
          >
            {relativeTime(exercise.lastActivityAt)}
          </time>
          <ReportKebab
            targetType="exercise"
            targetId={exercise._id}
            authorId={exercise.author?._id}
          />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <Link href={`/exercises/${exercise._id}`} className="block">
        <div className="flex flex-col gap-6 p-6">
          {/* Title */}
          <h3 className="line-clamp-2 text-end text-base font-bold leading-[26px] text-[#171C20]">
            <bdi>{localizedTitle}</bdi>
          </h3>

          {/* Content: math expression box OR image OR plain description */}
          {exercise.hasMath && !preview.url ? (
            <div className="rounded-[12px] border border-[rgba(223,227,232,0.5)] bg-[#F0F4F9] p-[25px] text-center">
              <p className="font-mono text-xl text-[#0095D1]">
                {exercise.description}
              </p>
            </div>
          ) : preview.kind === 'image' && preview.url ? (
            <div className="relative aspect-video overflow-hidden rounded-[12px] bg-muted">
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
            </div>
          ) : preview.kind === 'pdf' ? (
            <div className="rounded-[12px] border border-[rgba(223,227,232,0.5)] bg-[#F0F4F9] p-[25px] text-center">
              <p className="line-clamp-3 text-sm text-[#3E4850]">
                {exercise.description}
              </p>
            </div>
          ) : (
            <p className="line-clamp-3 text-end text-sm leading-relaxed text-[#3E4850]">
              {exercise.description}
            </p>
          )}
        </div>
      </Link>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between border-t border-[#D9EFF8] px-6 py-[16px]">
        {/* Start solving link */}
        <Link
          href={`/exercises/${exercise._id}`}
          className="flex items-center gap-1 text-sm font-bold text-[#0095D1] transition-colors hover:text-[#00709D]"
        >
          <span>{t('startSolving')}</span>
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>

        {/* Engagement counts */}
        <div className="flex items-center gap-3">
          {/* Comment count */}
          <Link
            href={`/exercises/${exercise._id}#solutions`}
            className="flex items-center gap-1 text-xs font-bold text-[#3E4850] transition-colors hover:text-[#171C20]"
          >
            <MessageCircle className="size-4" />
            <span className="font-mono tabular-nums">{exercise.commentsCount}</span>
          </Link>

          {/* Like button (interactive island) */}
          <LikeButton
            exerciseId={exercise._id}
            initialLiked={exercise.isLiked ?? false}
            initialCount={exercise.likesCount}
          />
        </div>
      </footer>
    </article>
  );
}
