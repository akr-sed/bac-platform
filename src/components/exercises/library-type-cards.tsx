import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { GraduationCap, FileText, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type LibrarySourceType = 'bac' | 'bac_blanc' | 'external';

interface TypeCount {
  bac: number;
  bac_blanc: number;
  external: number;
}

interface Props {
  counts: TypeCount;
  currentFiliere?: string;
}

const TYPE_ICONS: Record<LibrarySourceType, typeof GraduationCap> = {
  bac: GraduationCap,
  bac_blanc: FileText,
  external: Users,
};

const TYPE_ACCENTS: Record<LibrarySourceType, string> = {
  bac: 'from-amber-50 to-transparent dark:from-amber-950/30',
  bac_blanc: 'from-sky-50 to-transparent dark:from-sky-950/30',
  external: 'from-emerald-50 to-transparent dark:from-emerald-950/30',
};

export async function LibraryTypeCards({ counts, currentFiliere }: Props) {
  const tHub = await getTranslations('library.hub');
  const tTypes = await getTranslations('library.types');

  const types: LibrarySourceType[] = ['bac', 'bac_blanc', 'external'];

  const filiereQuery = currentFiliere ? `&filiere=${currentFiliere}` : '';

  return (
    <section className="space-y-6">
      <header>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {tHub('heading')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{tHub('subheading')}</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {types.map((type) => {
          const Icon = TYPE_ICONS[type];
          const accent = TYPE_ACCENTS[type];
          const count = counts[type] ?? 0;
          const href = `/library?type=${type}${filiereQuery}` as const;
          const isEmpty = count === 0;
          return (
            <Link
              key={type}
              href={href as never}
              className="group flex h-full"
              aria-disabled={isEmpty}
              tabIndex={isEmpty ? -1 : 0}
            >
              <Card
                className={`relative flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-gradient-to-b ${accent} shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 ${
                  isEmpty
                    ? 'opacity-60'
                    : 'hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]'
                }`}
              >
                <CardContent className="flex flex-1 flex-col gap-5 p-7">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-card text-foreground shadow-sm">
                    <Icon className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-semibold leading-tight text-foreground">
                      <bdi>{tTypes(type)}</bdi>
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      <bdi>{tTypes(`${type === 'bac_blanc' ? 'bacBlancDesc' : type === 'bac' ? 'bacDesc' : 'externalDesc'}`)}</bdi>
                    </p>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {tHub('exerciseCount', { count })}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isEmpty ? 'text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {tHub('explore')}
                      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
