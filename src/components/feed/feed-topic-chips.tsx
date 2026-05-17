import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { BookOpen } from 'lucide-react';
import { topicLabel, type ExamTopicLocale } from '@/lib/exam-topic-labels';

interface Props {
  topics: string[];
  selected?: string | null;
  locale: ExamTopicLocale;
  sort?: string;
  filter?: string;
}

const chipBase =
  'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150';
const chipActive = 'border-foreground bg-foreground text-background';
const chipIdle =
  'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground';

function buildHref(opts: {
  topic?: string | null;
  sort?: string;
  filter?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.sort && opts.sort !== 'for-you') params.set('sort', opts.sort);
  if (opts.filter && opts.filter !== 'all') params.set('filter', opts.filter);
  if (opts.topic) params.set('topic', opts.topic);
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

/**
 * Topic-filter chip row above the feed. Mirrors the library chip language
 * for visual consistency. Selecting a topic preserves the active sort and
 * filter (For You / Trending / Latest / Following).
 */
export async function FeedTopicChips({
  topics,
  selected,
  locale,
  sort,
  filter,
}: Props) {
  if (topics.length === 0) return null;
  const tFilter = await getTranslations('library.filter');
  const isAll = !selected;
  const sorted = [...topics].sort((a, b) =>
    topicLabel(a, locale).localeCompare(topicLabel(b, locale))
  );

  return (
    <nav aria-label={tFilter('topic')} className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <BookOpen className="size-3.5" />
        {tFilter('topic')}
      </span>
      <Link
        href={buildHref({ topic: null, sort, filter }) as never}
        aria-current={isAll ? 'page' : undefined}
        className={`${chipBase} ${isAll ? chipActive : chipIdle}`}
      >
        {tFilter('all')}
      </Link>
      {sorted.map((t) => {
        const active = selected === t;
        return (
          <Link
            key={t}
            href={buildHref({ topic: t, sort, filter }) as never}
            aria-current={active ? 'page' : undefined}
            className={`${chipBase} ${active ? chipActive : chipIdle}`}
          >
            {topicLabel(t, locale)}
          </Link>
        );
      })}
    </nav>
  );
}
