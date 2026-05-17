import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import type { SearchResultsDTO } from '@/types';

interface Props {
  q: string;
  results: SearchResultsDTO;
}

export async function SearchResults({ q, results }: Props) {
  const t = await getTranslations('search');

  if (!q) {
    return (
      <EmptyState
        variant="empty-search"
        title={t('noQuery.title')}
        description={t('noQuery.description')}
      />
    );
  }

  const total =
    results.exercises.length + results.sessions.length + results.profiles.length;

  if (total === 0) {
    return (
      <EmptyState
        variant="empty-search"
        title={t('empty.title')}
        description={t('empty.description')}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Exercises section */}
      {results.exercises.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-[#003449]">{t('sections.exercises')}</h2>
            <Link
              href={`/library` as any}
              className="text-sm font-semibold text-[#0095D1] hover:underline"
            >
              {t('seeAll')}
            </Link>
          </div>
          <div className="space-y-2">
            {results.exercises.map((ex) => (
              <Link
                key={ex._id}
                href={`/exercises/${ex._id}` as any}
                className="flex items-start gap-3 rounded-[14px] border border-[#BBC8D4] bg-white p-4 transition-colors hover:bg-[#E6F4FA]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#25313C]">{ex.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-[#6D7D8B]">
                    {ex.subject} · {ex.description}
                  </p>
                </div>
                <DifficultyBadge level={ex.difficulty} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sessions section */}
      {results.sessions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-[#003449]">{t('sections.sessions')}</h2>
            <Link
              href={`/sessions` as any}
              className="text-sm font-semibold text-[#0095D1] hover:underline"
            >
              {t('seeAll')}
            </Link>
          </div>
          <div className="space-y-2">
            {results.sessions.map((s) => (
              <Link
                key={s._id}
                href={`/sessions/${s._id}` as any}
                className="flex items-start gap-3 rounded-[14px] border border-[#BBC8D4] bg-white p-4 transition-colors hover:bg-[#E6F4FA]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#25313C]">{s.title}</p>
                  <p className="mt-0.5 text-xs text-[#6D7D8B]">
                    {s.subject} · {s.teacher.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Profiles section */}
      {results.profiles.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-[#003449]">{t('sections.profiles')}</h2>
          </div>
          <div className="space-y-2">
            {results.profiles.map((p) => (
              <Link
                key={p._id}
                href={`/profile/${p._id}` as any}
                className="flex items-center gap-3 rounded-[14px] border border-[#BBC8D4] bg-white p-4 transition-colors hover:bg-[#E6F4FA]"
              >
                <UserAvatar src={p.avatar} name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#25313C]">{p.name}</p>
                  {p.bio && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#6D7D8B]">{p.bio}</p>
                  )}
                </div>
                <RoleBadge role={p.role} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
