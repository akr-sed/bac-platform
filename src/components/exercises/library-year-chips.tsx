import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Calendar } from 'lucide-react';

interface Props {
  years: number[];                // distinct years available for the current type
  selectedYear?: number | null;   // null/undefined = "All years"
  type: string;                   // current source type, preserved in links
  filiere?: string;
  topic?: string;
  difficulty?: string;
}

const chipBase =
  'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150';
const chipActive = 'border-foreground bg-foreground text-background';
const chipIdle =
  'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground';

function buildHref(opts: {
  type: string;
  filiere?: string;
  year?: number;
  topic?: string;
  difficulty?: string;
}): string {
  const params = new URLSearchParams();
  params.set('type', opts.type);
  if (opts.filiere) params.set('filiere', opts.filiere);
  if (opts.year) params.set('year', String(opts.year));
  if (opts.topic) params.set('topic', opts.topic);
  if (opts.difficulty) params.set('difficulty', opts.difficulty);
  return `/library?${params.toString()}`;
}

export async function LibraryYearChips({
  years,
  selectedYear,
  type,
  filiere,
  topic,
  difficulty,
}: Props) {
  const t = await getTranslations('library.years');
  if (years.length === 0) return null;

  const allActive = !selectedYear;
  const sortedYears = [...years].sort((a, b) => b - a);

  return (
    <nav aria-label={t('label')} className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Calendar className="size-3.5" />
        {t('label')}
      </span>
      <Link
        href={buildHref({ type, filiere, topic, difficulty }) as never}
        aria-current={allActive ? 'page' : undefined}
        className={`${chipBase} ${allActive ? chipActive : chipIdle}`}
      >
        {t('all')}
      </Link>
      {sortedYears.map((y) => {
        const active = selectedYear === y;
        return (
          <Link
            key={y}
            href={buildHref({ type, filiere, year: y, topic, difficulty }) as never}
            aria-current={active ? 'page' : undefined}
            className={`${chipBase} font-mono tabular-nums ${active ? chipActive : chipIdle}`}
          >
            {y}
          </Link>
        );
      })}
    </nav>
  );
}
