import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Gauge } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Props {
  selected?: Difficulty | null;
  type?: string;
  year?: number;
  filiere?: string;
  topic?: string;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const chipBase =
  'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150';
const chipActive = 'border-foreground bg-foreground text-background';
const chipIdle =
  'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground';

function buildHref(opts: {
  filiere?: string;
  type?: string;
  year?: number;
  topic?: string;
  difficulty?: Difficulty | null;
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

export async function LibraryDifficultyChips({
  selected,
  type,
  year,
  filiere,
  topic,
}: Props) {
  const tFilter = await getTranslations('library.filter');
  const tDiff = await getTranslations('exercises.difficulty');
  const isAll = !selected;

  return (
    <nav aria-label={tFilter('difficulty')} className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Gauge className="size-3.5" />
        {tFilter('difficulty')}
      </span>

      <Link
        href={buildHref({ filiere, type, year, topic, difficulty: null }) as never}
        aria-current={isAll ? 'page' : undefined}
        className={`${chipBase} ${isAll ? chipActive : chipIdle}`}
      >
        {tFilter('all')}
      </Link>

      {DIFFICULTIES.map((d) => {
        const active = selected === d;
        return (
          <Link
            key={d}
            href={buildHref({ filiere, type, year, topic, difficulty: d }) as never}
            aria-current={active ? 'page' : undefined}
            className={`${chipBase} ${active ? chipActive : chipIdle}`}
          >
            {tDiff(d)}
          </Link>
        );
      })}
    </nav>
  );
}
