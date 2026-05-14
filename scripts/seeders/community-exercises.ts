import path from 'path';
import { promises as fs } from 'fs';
import { Types } from 'mongoose';
import Exercise from '../../src/models/Exercise';
import { FRAMING_TEMPLATES_AR, FRAMING_TEMPLATES_FR } from './data/algerian-names';
import { type SeedContext, pick, recentDate } from './context';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LEGACY_DIR = path.join(
  REPO_ROOT, 'data', 'dzexams', 'maths', 'bac', 'bac-results'
);

interface LegacyPart {
  statement?: string;
  label?: string;
  sub_label?: string | null;
}
interface LegacyExercise {
  number: number;
  statement?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  concepts?: string[];
  parts?: LegacyPart[];
}
interface LegacyDoc {
  exam_metadata?: { year?: number };
  exercises?: LegacyExercise[];
}

interface Reframeable {
  year: number | null;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concepts: string[];
  statement: string;
}

async function loadReframeable(): Promise<Reframeable[]> {
  const out: Reframeable[] = [];
  let files: string[] = [];
  try {
    const all = await fs.readdir(LEGACY_DIR);
    files = all.filter((f) => f.endsWith('.json') && !f.endsWith('.error.json'));
  } catch {
    return [];
  }
  for (const file of files) {
    const doc = JSON.parse(
      await fs.readFile(path.join(LEGACY_DIR, file), 'utf-8')
    ) as LegacyDoc;
    const year = doc.exam_metadata?.year ?? null;
    for (const ex of doc.exercises ?? []) {
      const allStatements: string[] = [];
      if (ex.statement) allStatements.push(ex.statement);
      for (const p of ex.parts ?? []) if (p.statement) allStatements.push(p.statement);
      for (const s of allStatements) {
        if (s.length < 80 || s.length > 400) continue;
        if (!ex.topic) continue;
        out.push({
          year,
          topic: ex.topic,
          difficulty: ex.difficulty ?? 'medium',
          concepts: ex.concepts ?? [],
          statement: s,
        });
      }
    }
  }
  return out;
}

export interface CommunityReport {
  total: number;
  byLocale: { ar: number; fr: number };
}

export async function seedCommunityExercises(
  ctx: SeedContext,
  targetCount: number
): Promise<CommunityReport> {
  const pool = await loadReframeable();
  if (pool.length === 0) {
    return { total: 0, byLocale: { ar: 0, fr: 0 } };
  }

  // Deterministic shuffle via rng-scored sort.
  const scored = pool.map((item) => ({ item, score: ctx.rng() }));
  scored.sort((a, b) => a.score - b.score);
  const items = scored.slice(0, targetCount).map((s) => s.item);

  const students = ctx.users.filter((u) => u.role === 'student');
  if (students.length === 0) return { total: 0, byLocale: { ar: 0, fr: 0 } };

  let ar = 0;
  let fr = 0;

  for (const item of items) {
    const useAr = ctx.rng() < 0.7;
    const tplPool = useAr ? FRAMING_TEMPLATES_AR : FRAMING_TEMPLATES_FR;
    const prefix = pick(tplPool, ctx.rng).replace('{year}', String(item.year ?? '????'));
    const description = `${prefix}\n\n${item.statement}`;
    const author = pick(students, ctx.rng);
    const createdAt = recentDate(90, ctx.rng);

    const created = await Exercise.create({
      title: `${item.topic ?? 'BAC'} — ${item.year ?? '???'}`,
      description,
      difficulty: item.difficulty,
      subject: 'mathematics',
      topic: item.topic ?? 'general',
      subtopic: '',
      authorId: author._id,
      attachments: [],
      concepts: item.concepts,
      hasMath: true,
      createdAt,
      lastActivityAt: createdAt,
    });

    ctx.communityExercises.push({
      _id: created._id as Types.ObjectId,
      authorId: author._id,
      topic: item.topic,
      createdAt,
    });
    if (useAr) ar += 1; else fr += 1;
  }

  return { total: items.length, byLocale: { ar, fr } };
}
