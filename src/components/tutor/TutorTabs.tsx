'use client';

// AI Tutor — orchestrator. Holds the shared exercise selection (URL-synced)
// and renders the three tab panels. Per-tab content lives in HintPanel /
// FeedbackPanel / SimilarPanel.
//
// Picker is a single source of truth at the top of the page; the three tabs
// only become active once an exercise is selected.

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Lightbulb, MessageSquare, Wand2 } from 'lucide-react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useExerciseIdParam } from './useExerciseIdParam';
import {
  TutorExercisePicker,
  type TutorExerciseOption,
} from './TutorExercisePicker';
import { SelectedExerciseCard } from './SelectedExerciseCard';
import { HintPanel } from './HintPanel';
import { FeedbackPanel } from './FeedbackPanel';
import { SimilarPanel } from './SimilarPanel';

type TabValue = 'hint' | 'feedback' | 'similar';

export function TutorTabs() {
  const t = useTranslations('tutor');
  const { exerciseId, setExerciseId } = useExerciseIdParam();

  const [options, setOptions] = useState<TutorExerciseOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/tutor/exercises-index?limit=150');
        if (!res.ok) return;
        const json = (await res.json()) as { data?: TutorExerciseOption[] };
        if (cancelled) return;
        setOptions(json.data ?? []);
      } catch {
        // Leave options empty; the picker handles the empty case.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected =
    exerciseId !== null
      ? options.find((o) => o._id === exerciseId) ?? null
      : null;

  // Edge case: ?exerciseId points at an id no longer in the index. Clear it
  // once options have loaded so the picker doesn't render a stale "selected"
  // chip with no card preview to follow it up.
  useEffect(() => {
    if (loading || !exerciseId) return;
    if (!options.some((o) => o._id === exerciseId)) {
      setExerciseId(null);
    }
  }, [loading, exerciseId, options, setExerciseId]);

  const noExercise = !exerciseId || !selected;

  return (
    <div className="space-y-6">
      {/* ── Picker card ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="tutor-picker-h"
        className="rounded-2xl border border-[#D9EFF8] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="tutor-picker-h"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-[#3E4850]"
          >
            {t('pickerHeading')}
          </h2>
        </div>

        <div className="space-y-3">
          <TutorExercisePicker
            value={exerciseId}
            onSelect={(opt) => setExerciseId(opt._id)}
            selected={selected}
            options={options}
            loading={loading}
          />

          {selected && (
            <SelectedExerciseCard
              exercise={selected}
              onChange={() => setExerciseId(null)}
            />
          )}

          {!selected && !loading && (
            <p className="text-xs text-[#6B7280]">{t('pickerHelp')}</p>
          )}
        </div>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="hint" className="w-full">
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TutorTabTrigger
            value="hint"
            label={t('tabs.hint')}
            icon={<Lightbulb className="size-4" />}
            disabled={noExercise}
            disabledHint={t('disabledHint')}
          />
          <TutorTabTrigger
            value="feedback"
            label={t('tabs.feedback')}
            icon={<MessageSquare className="size-4" />}
            disabled={noExercise}
            disabledHint={t('disabledHint')}
          />
          <TutorTabTrigger
            value="similar"
            label={t('tabs.similar')}
            icon={<Wand2 className="size-4" />}
            disabled={noExercise}
            disabledHint={t('disabledHint')}
          />
        </TabsList>

        {noExercise ? (
          <EmptyTutorState />
        ) : (
          <>
            <TabsContent value={'hint' satisfies TabValue} className="mt-6">
              <HintPanel exerciseId={exerciseId!} />
            </TabsContent>
            <TabsContent value={'feedback' satisfies TabValue} className="mt-6">
              <FeedbackPanel exerciseId={exerciseId!} />
            </TabsContent>
            <TabsContent value={'similar' satisfies TabValue} className="mt-6">
              <SimilarPanel exerciseId={exerciseId!} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function TutorTabTrigger({
  value,
  label,
  icon,
  disabled,
  disabledHint,
}: {
  value: TabValue;
  label: string;
  icon: ReactNode;
  disabled: boolean;
  disabledHint: string;
}) {
  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      className={cn(
        'gap-1.5',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  );
}

function EmptyTutorState() {
  const t = useTranslations('tutor');
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#BBC8D4] bg-[#F9FBFD] p-10 text-center sm:p-14">
      <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-[#E6F4FA]">
        <Wand2 className="size-6 text-[#0095D1]" aria-hidden="true" />
      </div>
      <p className="font-heading text-base font-semibold text-[#003449]">
        {t('emptyTitle')}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#3E4850]">
        {t('emptyBody')}
      </p>
    </div>
  );
}

export default TutorTabs;
