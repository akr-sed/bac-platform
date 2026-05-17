import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Types } from 'mongoose';
import { ChevronRight, Lock, Globe2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { AppShell } from '@/components/layout/AppShell';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Collection from '@/models/Collection';
import { CreateCollectionDialog } from '@/components/collections/create-collection-dialog';
import { EmptyState } from '@/components/ui/EmptyState';

type RouteParams = { params: Promise<{ locale: string }> };

interface ListItem {
  _id: string;
  title: string;
  description: string;
  visibility: 'public' | 'private';
  exerciseCount: number;
  updatedAt: string;
}

async function loadOwnCollections(userId: string): Promise<ListItem[]> {
  await connectToDatabase();
  const docs = await Collection.find({ ownerId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map((c) => ({
    _id: String(c._id),
    title: c.title,
    description: c.description ?? '',
    visibility: c.visibility,
    exerciseCount: (c.exerciseIds ?? []).length,
    updatedAt: (c.updatedAt ?? new Date()).toISOString(),
  }));
}

export default async function CollectionsPage({ params }: RouteParams) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations('collections');
  const items = await loadOwnCollections(session.userId);
  const canCreate = session.role === 'teacher' || session.role === 'admin';

  return (
    <AppShell>
      <div className="py-6 sm:py-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t('myCollections')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('title')}</p>
          </div>
          {canCreate && <CreateCollectionDialog />}
        </header>

        {items.length === 0 ? (
          <EmptyState
            variant="empty-saved"
            title={t('empty')}
            description={t('title')}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/collections/${c._id}` as `/collections/${string}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-base font-bold text-foreground">
                      {c.title}
                    </h2>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        c.visibility === 'public'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.visibility === 'public' ? (
                        <Globe2 className="size-3" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                      {t(`visibility.${c.visibility}`)}
                    </span>
                  </div>

                  {c.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between pt-2 text-xs">
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {t('exerciseCount', { count: c.exerciseCount })}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#0095D1] transition-colors group-hover:text-[#00709D]">
                      {t('manage')}
                      <ChevronRight className="size-4 rtl:rotate-180" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
