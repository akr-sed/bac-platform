/**
 * Renders an exercise title in the viewer's locale.
 *
 * Imported BAC exercises are persisted with an auto-generated Latin title
 * (`BAC 2099 — arithmetique #1`) when the parser does not provide one — see
 * `src/app/api/exams/import/route.ts`. That string is fine for storage (the
 * topic slug is the canonical cross-locale key) but reads as foreign matter
 * inside an Arabic feed: the bidi algorithm reorders the parts and Plex
 * Arabic falls back to Plex Sans on every glyph.
 *
 * This helper detects the auto-generated pattern at render time and rewrites
 * it in the viewer's locale (e.g. `بكالوريا 2099 — الحسابيات #1`). For any
 * other title (teacher-provided, parser-provided, …) it returns the original
 * string verbatim — we never paraphrase user content.
 *
 * Pure (no React, no DOM) so it can be unit tested in isolation.
 */
import { topicLabel, type ExamTopicLocale } from './exam-topic-labels';

interface ExerciseLike {
  title?: string | null;
  topic?: string | null;
  examNumber?: number | null;
}

const BAC_PREFIX: Record<ExamTopicLocale, string> = {
  ar: 'بكالوريا',
  fr: 'BAC',
  en: 'BAC',
};

/**
 * Matches `BAC 2099 — <slug> #1`. The slug is permissive: lowercase letters,
 * digits, hyphens, underscores. Any other shape (e.g. teacher-typed Arabic
 * title) skips this rewrite and the original `title` is returned.
 *
 * Uses positional capture groups (year, slug, number) instead of named
 * groups so the TypeScript ES2017 target stays happy.
 */
const AUTO_TITLE_PATTERN =
  /^BAC\s+(\d{4})\s+[—-]\s+([a-z0-9_-]+)\s+#(\d+)$/i;

/**
 * Returns the exercise title rendered in the viewer's locale. Falls back to
 * the stored title when no rewrite is appropriate.
 */
export function resolveExerciseTitle(
  exercise: ExerciseLike | null | undefined,
  locale: string | undefined | null
): string {
  if (!exercise) return '';
  const stored = exercise.title?.trim() ?? '';
  if (!stored) return '';

  const topicLocale: ExamTopicLocale =
    locale === 'fr' || locale === 'en' || locale === 'ar' ? locale : 'ar';

  const match = stored.match(AUTO_TITLE_PATTERN);
  if (match) {
    const [, year, slug, number] = match;
    const localizedTopic = topicLabel(slug, topicLocale);
    return `${BAC_PREFIX[topicLocale]} ${year} — ${localizedTopic} #${number}`;
  }

  return stored;
}
