'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bookmark, FilePlus, Loader2, Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { cn } from '@/lib/utils';
import type { FeedItemDTO, ActivityEntryDTO } from '@/types';

interface ActivityTabsProps {
  activity: ActivityEntryDTO[];
}

function timeAgo(isoDate: string, locale: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);

  if (locale === 'ar') {
    if (hours < 1) return 'منذ قليل';
    if (hours < 24) return `قبل ${hours} ساعة`;
    if (days === 1) return 'أمس';
    return `منذ ${days} يوم`;
  }
  if (locale === 'fr') {
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    return `Il y a ${days} jours`;
  }
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function kindLabel(kind: string, locale: string): string {
  const map: Record<string, Record<string, string>> = {
    'exercise-solved': { ar: 'أكمل تمريناً', fr: 'Exercice complété', en: 'Completed exercise' },
    comment: { ar: 'أضاف تعليقاً', fr: 'Commentaire ajouté', en: 'Added a comment' },
    achievement: { ar: 'إنجاز جديد', fr: 'Succès débloqué', en: 'Achievement unlocked' },
  };
  return map[kind]?.[locale] ?? map[kind]?.['en'] ?? kind;
}

type TabKey = 'activity' | 'saved' | 'mine';

function adaptApiExercise(raw: Record<string, unknown>, saved: boolean): FeedItemDTO {
  // Both /api/saves and /api/exercises return the same shape with `authorId`
  // either populated or as an id. We normalize to FeedItemDTO here.
  const authorRaw = raw.authorId ?? raw.author ?? {};
  const author = (typeof authorRaw === 'object' && authorRaw !== null
    ? (authorRaw as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  return {
    _id: String(raw._id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    difficulty: (raw.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
    subject: String(raw.subject ?? ''),
    topic: String(raw.topic ?? ''),
    attachments: Array.isArray(raw.attachments) ? (raw.attachments as string[]) : [],
    likesCount: Number(raw.likesCount ?? 0),
    solutionCount: Number(raw.solutionCount ?? 0),
    commentsCount: Number(raw.commentsCount ?? 0),
    lastActivityAt: raw.lastActivityAt
      ? new Date(raw.lastActivityAt as string).toISOString()
      : new Date().toISOString(),
    author: {
      _id: String(author._id ?? ''),
      name: String(author.name ?? ''),
      avatar: (author.avatar as string | null | undefined) ?? null,
      role: (author.role as 'student' | 'teacher' | 'admin') ?? 'student',
      isVerifiedTeacher: Boolean(author.isVerifiedTeacher),
      points:
        typeof author.points === 'number'
          ? (author.points as number)
          : undefined,
    },
    isLiked: Boolean(raw.isLiked),
    isSaved: saved || Boolean(raw.isSaved),
  };
}

export function ActivityTabs({ activity }: ActivityTabsProps) {
  const t = useTranslations('profileDashboard');
  const [activeTab, setActiveTab] = useState<TabKey>('activity');
  const [savedItems, setSavedItems] = useState<FeedItemDTO[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');
  const [mineItems, setMineItems] = useState<FeedItemDTO[] | null>(null);
  const [mineLoading, setMineLoading] = useState(false);
  const [mineError, setMineError] = useState('');

  // Detect locale from html dir attribute as a simple proxy
  const locale = typeof document !== 'undefined' && document.documentElement.dir === 'rtl' ? 'ar' : 'en';

  function switchToSaved() {
    setActiveTab('saved');
    if (savedItems !== null || savedLoading) return;
    setSavedLoading(true);
    fetch('/api/saves')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        const raw: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : [];
        const adapted: FeedItemDTO[] = raw
          .filter((ex) => ex !== null && ex !== undefined)
          .map((ex) => adaptApiExercise(ex, true));
        setSavedItems(adapted);
      })
      .catch(() => setSavedError(locale === 'ar' ? 'تعذّر تحميل المحفوظات' : 'Failed to load saved exercises'))
      .finally(() => setSavedLoading(false));
  }

  function switchToMine() {
    setActiveTab('mine');
    if (mineItems !== null || mineLoading) return;
    setMineLoading(true);
    fetch('/api/exercises?authorId=me&limit=50')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        const raw: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : [];
        const adapted: FeedItemDTO[] = raw
          .filter((ex) => ex !== null && ex !== undefined)
          .map((ex) => adaptApiExercise(ex, false));
        setMineItems(adapted);
      })
      .catch(() => setMineError(locale === 'ar' ? 'تعذّر تحميل منشوراتك' : 'Failed to load your posts'))
      .finally(() => setMineLoading(false));
  }

  function handleTabClick(key: TabKey) {
    if (key === 'saved') switchToSaved();
    else if (key === 'mine') switchToMine();
    else setActiveTab('activity');
  }

  const tabs = [
    { key: 'activity' as const, label: t('activityTab') },
    { key: 'saved' as const, label: t('savedTab') },
    { key: 'mine' as const, label: t('mineTab') },
  ];

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#DFE3E8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      {/* Tab headers */}
      <div className="flex items-center border-b border-[#DFE3E8] bg-[rgba(240,244,249,0.5)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={cn(
              'flex-1 cursor-pointer py-4 text-center text-[14px] font-semibold font-arabic transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-[#0095D1] text-[#0095D1]'
                : 'text-[#3E4850] hover:text-[#171C20]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'activity' && (
          <>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-[#3E4850] font-arabic">{t('activityEmpty')}</p>
            ) : (
              <div className="relative border-e-2 border-[#DFE3E8] pe-8">
                <div className="flex flex-col gap-8">
                  {activity.map((entry, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'absolute -end-[33px] top-1 size-4 rounded-full border-4 border-white',
                          idx === 0 ? 'bg-[#0095D1]' : 'bg-[#DFE3E8]'
                        )}
                      />
                      <div className="rounded-[8px] border border-[#DFE3E8] bg-[#EAEEF3] p-4">
                        <div className="mb-1 flex items-start justify-between gap-4">
                          <span className="text-[12px] text-[#3E4850] font-arabic">
                            {timeAgo(entry.at, locale)}
                          </span>
                          <span className="text-[14px] font-semibold text-[#171C20] font-arabic text-end">
                            {kindLabel(entry.kind, locale)}: {entry.title}
                          </span>
                        </div>
                        {entry.kind === 'exercise-solved' && (
                          <div className="mt-2 flex justify-end">
                            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#DCFCE7] px-2 py-1 text-[12px] font-medium text-[#166534]">
                              +50 XP
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <>
            {savedLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-6 animate-spin text-[#0095D1]" />
              </div>
            ) : savedError ? (
              <p className="py-8 text-center text-[14px] text-destructive font-arabic">{savedError}</p>
            ) : savedItems && savedItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {savedItems.map((ex) => (
                  <ExerciseCard key={ex._id} variant="compact" exercise={ex} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-[#3E4850]">
                <Bookmark className="mb-3 size-10 opacity-40" />
                <p className="text-[14px] font-arabic">{t('savedEmpty')}</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'mine' && (
          <>
            {mineLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-6 animate-spin text-[#0095D1]" />
              </div>
            ) : mineError ? (
              <p className="py-8 text-center text-[14px] text-destructive font-arabic">{mineError}</p>
            ) : mineItems && mineItems.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Link
                    href="/exercises/new"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0095D1] px-3 py-1.5 text-xs font-semibold text-[#0095D1] transition-colors hover:bg-[#0095D1] hover:text-white"
                  >
                    <Plus className="size-3.5" />
                    <span>{t('mineCompose')}</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {mineItems.map((ex) => (
                    <ExerciseCard key={ex._id} variant="compact" exercise={ex} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-[#3E4850]">
                <FilePlus className="mb-3 size-10 opacity-40" />
                <p className="mb-4 text-[14px] font-arabic">{t('mineEmpty')}</p>
                <Link
                  href="/exercises/new"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0095D1] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#00709D]"
                >
                  <Plus className="size-3.5" />
                  <span>{t('mineCompose')}</span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
