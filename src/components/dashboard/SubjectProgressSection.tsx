'use client';

import { RefreshCw, Calculator, FlaskConical, Leaf } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SubjectProgress {
  subject: string;
  completed: number;
  total: number;
  pct: number;
}

interface SubjectProgressSectionProps {
  subjects: SubjectProgress[];
}

// Subject icon + label mapping (Arabic subject keys)
const SUBJECT_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  math: { icon: Calculator, color: '#0095D1' },
  physics: { icon: FlaskConical, color: '#0095D1' },
  biology: { icon: Leaf, color: '#0095D1' },
  chemistry: { icon: FlaskConical, color: '#0095D1' },
};

// Arabic subject name → subject key
const AR_NAME_MAP: Record<string, string> = {
  'الرياضيات': 'math',
  'الفيزياء': 'physics',
  'العلوم الطبيعية': 'biology',
  'الكيمياء': 'chemistry',
};

export function SubjectProgressSection({ subjects }: SubjectProgressSectionProps) {
  const t = useTranslations('profileDashboard.subjectProgress');

  return (
    <div className="min-w-0 overflow-hidden rounded-[12px] border border-[#DFE3E8] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-2 border-b border-[#DFE3E8] pb-4">
        <RefreshCw className="size-5 shrink-0 text-[#3E4850]" />
        <h2 className="min-w-0 truncate text-[20px] font-semibold text-[#171C20] font-arabic sm:text-[24px]">{t('title')}</h2>
      </div>

      {subjects.length === 0 ? (
        <p className="text-center text-[14px] text-[#3E4850] font-arabic py-4">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => {
            const subKey = AR_NAME_MAP[sub.subject] ?? sub.subject.toLowerCase();
            const meta = SUBJECT_META[subKey];
            const Icon = meta?.icon ?? Calculator;

            return (
              <div key={sub.subject} className="flex min-w-0 flex-col gap-2">
                {/* Subject name + icon + percentage */}
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0 text-[14px] font-semibold text-[#0095D1] font-arabic tabular-nums">
                    {sub.pct}%
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-[#171C20] font-arabic">
                      {sub.subject}
                    </span>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] bg-[#C7E7FF]">
                      <Icon className="size-[10.5px] text-[#0095D1]" />
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E8EE]">
                  <div
                    className="h-full rounded-full bg-[#0095D1] transition-all"
                    style={{ width: `${sub.pct}%` }}
                  />
                </div>

                {/* Caption */}
                <p className="text-end text-[12px] text-[#3E4850] font-arabic">
                  {t('completed', { completed: sub.completed, total: sub.total })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
