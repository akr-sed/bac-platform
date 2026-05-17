import { getTranslations } from 'next-intl/server';
import { Calendar, Megaphone, Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Teacher quick-action bar — three Figma-spec actions surfaced at the top of
 * the teacher home page. The third action ("announce to students") is not
 * implemented yet, so we render its slot disabled with a native `title`
 * tooltip explaining it's coming soon. Using `title` (rather than the
 * Base UI Tooltip primitive) keeps this a pure server component with zero
 * client JS.
 */
export async function QuickActionBar() {
  const t = await getTranslations('teacher');

  return (
    <section
      aria-labelledby="teacher-quick-actions-heading"
      className="mb-6 rounded-[16px] border border-[#D9EFF8] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/exercises/new"
            className={cn(
              buttonVariants({ intent: 'primary-blue', size: 'sm' }),
              'cursor-pointer gap-1.5'
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{t('actions.uploadExercise')}</span>
          </Link>

          <Link
            href="/sessions/new"
            className={cn(
              buttonVariants({ intent: 'secondary-blue', size: 'sm' }),
              'cursor-pointer gap-1.5'
            )}
          >
            <Calendar className="size-4" aria-hidden="true" />
            <span>{t('actions.scheduleSession')}</span>
          </Link>

          {/* Reserved slot — not implemented yet. Native `title` keeps this a
              zero-JS server component while still hinting at the rationale. */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={t('actions.announceComingSoon')}
            className={cn(
              buttonVariants({ intent: 'secondary-blue', size: 'sm' }),
              'cursor-not-allowed gap-1.5 opacity-50'
            )}
          >
            <Megaphone className="size-4" aria-hidden="true" />
            <span>{t('actions.announceToStudents')}</span>
          </button>
        </div>

        <span
          id="teacher-quick-actions-heading"
          className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
        >
          {t('quickActions')}
        </span>
      </div>
    </section>
  );
}

export default QuickActionBar;
