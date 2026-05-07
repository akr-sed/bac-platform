import { describe, it, expect } from 'vitest';
import { resolveExerciseTitle } from '../resolve-exercise-title';

describe('resolveExerciseTitle', () => {
  it('rewrites the auto-generated Latin title in Arabic', () => {
    expect(
      resolveExerciseTitle(
        { title: 'BAC 2099 — arithmetique #1', topic: 'arithmetique', examNumber: 1 },
        'ar'
      )
    ).toBe('بكالوريا 2099 — الحسابيات #1');
  });

  it('rewrites the auto-generated Latin title in French (localized topic)', () => {
    expect(
      resolveExerciseTitle(
        { title: 'BAC 2099 — geometrie #2', topic: 'geometrie', examNumber: 2 },
        'fr'
      )
    ).toBe('BAC 2099 — Géométrie #2');
  });

  it('rewrites the auto-generated Latin title in English', () => {
    expect(
      resolveExerciseTitle(
        { title: 'BAC 2018 — probabilites #3', topic: 'probabilites', examNumber: 3 },
        'en'
      )
    ).toBe('BAC 2018 — Probability #3');
  });

  it('returns the stored title verbatim when it does not match the auto pattern', () => {
    const teacherTitle = 'مراجعة الدوال الأسية';
    expect(
      resolveExerciseTitle({ title: teacherTitle, topic: 'fonctions' }, 'ar')
    ).toBe(teacherTitle);
  });

  it('returns the stored title verbatim for parser-provided titles', () => {
    const parserTitle = 'Étude d\'une fonction logarithme';
    expect(
      resolveExerciseTitle({ title: parserTitle, topic: 'fonctions' }, 'fr')
    ).toBe(parserTitle);
  });

  it('handles unknown slugs by humanising them', () => {
    expect(
      resolveExerciseTitle(
        { title: 'BAC 2010 — mon_topic #5', topic: 'mon_topic' },
        'ar'
      )
    ).toBe('بكالوريا 2010 — Mon Topic #5');
  });

  it('returns empty string for null / undefined / empty input', () => {
    expect(resolveExerciseTitle(null, 'ar')).toBe('');
    expect(resolveExerciseTitle(undefined, 'ar')).toBe('');
    expect(resolveExerciseTitle({ title: '' }, 'ar')).toBe('');
    expect(resolveExerciseTitle({ title: '   ' }, 'ar')).toBe('');
  });

  it('defaults to Arabic when no locale is provided', () => {
    expect(
      resolveExerciseTitle(
        { title: 'BAC 2099 — analyse #4', topic: 'analyse' },
        undefined
      )
    ).toBe('بكالوريا 2099 — التحليل #4');
  });

  it('falls back to Arabic for unknown locale strings', () => {
    expect(
      resolveExerciseTitle(
        { title: 'BAC 2099 — suites #4', topic: 'suites' },
        'de'
      )
    ).toBe('بكالوريا 2099 — المتتاليات #4');
  });
});
