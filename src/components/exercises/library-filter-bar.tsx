import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Layers } from 'lucide-react';
import { FILIERE_KEYS, type FiliereKey } from '@/lib/filiere';

interface Props {
  filiere?: string;
  // Other query params the filter must preserve when the user picks a chip.
  type?: string;
  year?: number;
  topic?: string;
  difficulty?: string;
}

const chipBase =
  'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150';
const chipActive = 'border-foreground bg-foreground text-background';
const chipIdle =
  'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground';

function buildHref(opts: {
  filiere?: string | null;
  type?: string;
  year?: number;
  topic?: string;
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

/**
 * Filière (BAC stream) selector for the /library hub + filtered view.
 *
 * Same chip-row visual language as the year chips so the two filters read
 * as a single toolbar. Server-rendered — each chip is a real `<Link>` and
 * navigation produces a fresh server-rendered page (no client hydration of
 * filter state). Other query params (`type`, `year`) are preserved.
 */
export async function LibraryFilterBar({ filiere = '', type, year, topic, difficulty }: Props) {
  const t = await getTranslations('library.filter');
  const tF = await getTranslations('library.filiere');

  const isAll = !filiere;
  const allowed = FILIERE_KEYS as readonly FiliereKey[];

  return (
    <nav aria-label={t('filiere')} className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Layers className="size-3.5" />
        {t('filiere')}
      </span>

      <Link
        href={buildHref({ filiere: null, type, year, topic, difficulty }) as never}
        aria-current={isAll ? 'page' : undefined}
        className={`${chipBase} ${isAll ? chipActive : chipIdle}`}
      >
        {t('all')}
      </Link>

      {allowed.map((key) => {
        const active = filiere === key;
        return (
          <Link
            key={key}
            href={buildHref({ filiere: key, type, year, topic, difficulty }) as never}
            aria-current={active ? 'page' : undefined}
            className={`${chipBase} ${active ? chipActive : chipIdle}`}
          >
            {tF(key)}
          </Link>
        );
      })}
    </nav>
  );
}

export default LibraryFilterBar;
