/**
 * Topic slug → localized label resolver for exam exercises.
 *
 * Slugs come from the BAC exam parser pipeline (see /home/akram/Downloads/Telegram Desktop/2022.json
 * for a sample). Arabic is the canonical translation since the platform's primary locale is `ar`.
 *
 * Unknown slugs fall back to a humanised version of the slug itself (e.g. `mon_topic` → `Mon Topic`).
 */

export type ExamTopicLocale = 'ar' | 'fr' | 'en';

type LabelSet = { ar: string; fr: string; en: string };

export const EXAM_TOPIC_LABELS: Record<string, LabelSet> = {
  arithmetique: { ar: 'الحسابيات', fr: 'Arithmétique', en: 'Arithmetic' },
  analyse: { ar: 'التحليل', fr: 'Analyse', en: 'Analysis' },
  geometrie: { ar: 'الهندسة', fr: 'Géométrie', en: 'Geometry' },
  statistiques: { ar: 'الإحصاء', fr: 'Statistiques', en: 'Statistics' },
  probabilites: { ar: 'الاحتمالات', fr: 'Probabilités', en: 'Probability' },
  suites: { ar: 'المتتاليات', fr: 'Suites', en: 'Sequences' },
  fonctions: { ar: 'الدوال', fr: 'Fonctions', en: 'Functions' },
  algebre: { ar: 'الجبر', fr: 'Algèbre', en: 'Algebra' },
  trigonometrie: { ar: 'حساب المثلثات', fr: 'Trigonométrie', en: 'Trigonometry' },
  nombres_complexes: { ar: 'الأعداد المركبة', fr: 'Nombres complexes', en: 'Complex Numbers' },
};

/**
 * Convert an unknown slug into a readable fallback (e.g. `nombres_complexes` → `Nombres Complexes`).
 */
function humaniseSlug(slug: string): string {
  if (!slug) return '';
  return slug
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Returns the localized label for a topic slug.
 *
 * Defaults to Arabic (the platform's primary locale) when no locale is provided.
 * When the slug is unknown, returns a humanised version of the slug itself.
 */
export function topicLabel(
  slug: string | null | undefined,
  locale: ExamTopicLocale = 'ar'
): string {
  if (!slug) return '';
  const entry = EXAM_TOPIC_LABELS[slug];
  if (entry) return entry[locale] ?? entry.ar ?? slug;
  return humaniseSlug(slug);
}
