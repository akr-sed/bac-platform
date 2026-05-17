// Shared subject-pill + source-chip helpers. Consumed by the feed exercise
// card, the tutor picker, the tutor selected-card preview, and anywhere else
// that needs to render an exercise's classification badges consistently.

export const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  math: { bg: 'bg-[#7ECCFE]', text: 'text-[#00709D]' },
  mathematics: { bg: 'bg-[#7ECCFE]', text: 'text-[#00709D]' },
  رياضيات: { bg: 'bg-[#7ECCFE]', text: 'text-[#00709D]' },
  physics: { bg: 'bg-[#FFDCBF]', text: 'text-[#6B3B00]' },
  فيزياء: { bg: 'bg-[#FFDCBF]', text: 'text-[#6B3B00]' },
  chemistry: { bg: 'bg-[#D9EFF8]', text: 'text-[#0095D1]' },
  كيمياء: { bg: 'bg-[#D9EFF8]', text: 'text-[#0095D1]' },
  biology: { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
  'علوم طبيعية': { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
};

export function subjectBadgeClass(subject: string): string {
  const key = (subject ?? '').toLowerCase();
  const match = SUBJECT_COLORS[key] ?? {
    bg: 'bg-[#EAEEF3]',
    text: 'text-[#3E4850]',
  };
  return `${match.bg} ${match.text}`;
}

const DIFFICULTY_DOT: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'bg-[#10B981]',
  medium: 'bg-[#F59E0B]',
  hard: 'bg-[#ED2D30]',
};

export function difficultyDotClass(level: 'easy' | 'medium' | 'hard' | null | undefined): string {
  return DIFFICULTY_DOT[level ?? 'medium'];
}

/**
 * Format a localized source label for the tutor picker / selected card.
 *   - "BAC 2023" / "BAC blanc 2022" when the exercise belongs to an exam
 *   - "Community" / "مجتمع" / "Communauté" for community posts
 *
 * Locale is passed in so the helper stays pure (works server-side too).
 */
export function sourceLabel(
  source: 'bac' | 'bac_blanc' | 'community',
  year: number | null | undefined,
  locale: 'ar' | 'fr' | 'en'
): string {
  if (source === 'community') {
    if (locale === 'ar') return 'مجتمع';
    if (locale === 'fr') return 'Communauté';
    return 'Community';
  }
  const prefix =
    source === 'bac_blanc'
      ? locale === 'ar'
        ? 'بكالوريا تجريبي'
        : locale === 'fr'
          ? 'BAC blanc'
          : 'BAC blanc'
      : locale === 'ar'
        ? 'بكالوريا'
        : 'BAC';
  return year ? `${prefix} ${year}` : prefix;
}
