import { describe, it, expect } from 'vitest';
import { topicLabel, EXAM_TOPIC_LABELS } from '../exam-topic-labels';

describe('topicLabel', () => {
  it('returns the Arabic label for a known slug by default', () => {
    expect(topicLabel('arithmetique')).toBe('الحسابيات');
    expect(topicLabel('analyse')).toBe('التحليل');
    expect(topicLabel('geometrie')).toBe('الهندسة');
    expect(topicLabel('statistiques')).toBe('الإحصاء');
    expect(topicLabel('probabilites')).toBe('الاحتمالات');
    expect(topicLabel('suites')).toBe('المتتاليات');
    expect(topicLabel('fonctions')).toBe('الدوال');
  });

  it('returns the French label when locale is fr', () => {
    expect(topicLabel('arithmetique', 'fr')).toBe('Arithmétique');
    expect(topicLabel('geometrie', 'fr')).toBe('Géométrie');
  });

  it('returns the English label when locale is en', () => {
    expect(topicLabel('arithmetique', 'en')).toBe('Arithmetic');
    expect(topicLabel('probabilites', 'en')).toBe('Probability');
  });

  it('falls back to a humanised slug when the slug is unknown', () => {
    expect(topicLabel('mon_topic')).toBe('Mon Topic');
    expect(topicLabel('autre-truc-bidule')).toBe('Autre Truc Bidule');
    expect(topicLabel('singleword')).toBe('Singleword');
  });

  it('returns an empty string for nullish input', () => {
    expect(topicLabel(null)).toBe('');
    expect(topicLabel(undefined)).toBe('');
    expect(topicLabel('')).toBe('');
  });

  it('covers the seven minimum required slugs from the spec', () => {
    const required = [
      'arithmetique',
      'analyse',
      'geometrie',
      'statistiques',
      'probabilites',
      'suites',
      'fonctions',
    ];
    for (const slug of required) {
      expect(EXAM_TOPIC_LABELS[slug]).toBeDefined();
      expect(EXAM_TOPIC_LABELS[slug].ar.length).toBeGreaterThan(0);
    }
  });
});
