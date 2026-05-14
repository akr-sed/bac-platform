import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { BookOpen } from 'lucide-react';
import { topicLabel, type ExamTopicLocale } from '@/lib/exam-topic-labels';

interface Props {
  topics: string[];                    // distinct topic slugs available for current scope
  selected?: string | null;            // null = "All topics"
  locale: ExamTopicLocale;
  type?: string;
  year?: number;
  filiere?: string;
  difficulty?: string;
}

const chipBase =
  'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150';
const chipActive = 'border-foreground bg-foreground text-background';
const chipIdle =
  'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground';

function buildHref(opts: {
  filiere?: string;
  type?: string;
  year?: number;
  topic?: string | null;
  difficulty?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.filiere) params.set('filiere', opts.filiere);
  if (opts.type) params.set('type', opts.type);
  if (opts.year) params.set('year', String(opts.year));
  if (opts.topic) params.set('topic', opts.topic);
  if (opts.difficulty) params.set('difficulty', opts.difficulty);
  const qs = params.toString();
  return qs ? `/library?${qs}` : '/library';
}

export async function LibraryTopicChips({
  topics,
  selected,
  locale,
  type,
  year,
  filiere,
  difficulty,
}: Props) {
  const tFilter = await getTranslations('library.filter');
  if (topics.length === 0) return null;

  const isAll = !selected;
  // Stable display order: alphabetical by localised label.
  const sorted = [...topics].sort((a, b) =>
    topicLabel(a, locale).localeCompare(topicLabel(b, locale))
  );

  return (
    <nav aria-label={tFilter('topic')} className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <BookOpen className="size-3.5" />
        {tFilter('topic')}
      </span>

      <Link
        href={buildHref({ filiere, type, year, topic: null, difficulty }) as never}
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
            href={buildHref({ filiere, type, year, topic: t, difficulty }) as never}
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
