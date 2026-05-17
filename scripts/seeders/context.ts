import type { Types } from 'mongoose';

/** Deterministic PRNG. Three lines, no deps. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeededUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher: boolean;
  filiere?: string;
}

export interface SeededExercise {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  topic?: string;
  createdAt: Date;
}

export interface SeededSolution {
  _id: Types.ObjectId;
  exerciseId: Types.ObjectId;
  authorId: Types.ObjectId;
  createdAt: Date;
}

export interface SeedContext {
  preservedUserId: Types.ObjectId;
  systemUserId: Types.ObjectId;
  rng: () => number;
  options: {
    small: boolean;
    skipLibrary: boolean;
    skipCommunity: boolean;
  };
  users: SeededUser[];
  libraryExercises: SeededExercise[];
  communityExercises: SeededExercise[];
  solutions: SeededSolution[];
  counts: Record<string, number>;
}

/** Convenience: pick a uniform-random item from an array using ctx.rng. */
export function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Convenience: weighted choice. weights need not sum to 1. */
export function weightedPick<T>(
  items: ReadonlyArray<readonly [T, number]>,
  rng: () => number
): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

/** Pick N distinct items from an array. N must be <= arr.length. */
export function pickN<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

/** Random date in the last `days` days from now. */
export function recentDate(days: number, rng: () => number): Date {
  const now = Date.now();
  const offset = Math.floor(rng() * days * 86400000);
  return new Date(now - offset);
}
