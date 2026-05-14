import { Types } from 'mongoose';
import Solution from '../../src/models/Solution';
import {
  SOLUTION_TEMPLATES_AR,
  SOLUTION_TEMPLATES_FR,
} from './data/solution-templates';
import {
  type SeedContext,
  type SeededSolution,
  pick,
} from './context';

export interface SolutionsReport {
  total: number;
  official: number;
  exercisesWithSolutions: number;
}

export async function seedSolutions(ctx: SeedContext): Promise<SolutionsReport> {
  let official = 0;
  let exercisesWithSolutions = 0;
  const created: SeededSolution[] = [];
  const teachers = ctx.users.filter((u) => u.role === 'teacher');
  const students = ctx.users.filter((u) => u.role === 'student');
  if (teachers.length === 0 && students.length === 0) {
    return { total: 0, official: 0, exercisesWithSolutions: 0 };
  }

  for (const ex of ctx.communityExercises) {
    if (ctx.rng() < 0.5) continue;
    const n = 1 + Math.floor(ctx.rng() * 3);
    exercisesWithSolutions += 1;
    let last = ex.createdAt.getTime();
    for (let i = 0; i < n; i++) {
      const useTeacher = ctx.rng() < 0.6 && teachers.length > 0;
      const author = useTeacher ? pick(teachers, ctx.rng) : pick(students, ctx.rng);
      const isOfficial = useTeacher && ctx.rng() < 0.3;
      const useAr = ctx.rng() < 0.7;
      const tplPool = useAr ? SOLUTION_TEMPLATES_AR : SOLUTION_TEMPLATES_FR;
      const content = pick(tplPool, ctx.rng);
      const createdAt = new Date(last + Math.floor(ctx.rng() * 7 * 86400000));
      last = createdAt.getTime();

      const sol = await Solution.create({
        exerciseId: ex._id,
        authorId: author._id,
        content,
        images: [],
        likes: [],
        isOfficial,
        createdAt,
      });

      if (isOfficial) official += 1;
      created.push({
        _id: sol._id as Types.ObjectId,
        exerciseId: ex._id,
        authorId: author._id,
        createdAt,
      });
    }
  }

  ctx.solutions.push(...created);
  return { total: created.length, official, exercisesWithSolutions };
}
