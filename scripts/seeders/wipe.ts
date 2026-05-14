import { Types } from 'mongoose';
import User from '../../src/models/User';
import Exercise from '../../src/models/Exercise';
import Exam from '../../src/models/Exam';
import Solution from '../../src/models/Solution';
import Comment from '../../src/models/Comment';
import ExerciseLike from '../../src/models/ExerciseLike';
import SavedExercise from '../../src/models/SavedExercise';
import Follow from '../../src/models/Follow';

export interface WipeReport {
  byCollection: Record<string, number>;
  preserved: { userId: string; email: string };
}

/**
 * Phase 2: wipe everything except documents tied to `preservedUserId`.
 *
 *  - User: delete every doc except this one.
 *  - Exercises authored by preservedUserId → kept. Others → deleted.
 *  - Solutions authored by preservedUserId → kept (regardless of exercise).
 *  - Comments authored by preservedUserId → kept.
 *  - ExerciseLike with userId === preservedUserId → kept.
 *  - SavedExercise with userId === preservedUserId → kept.
 *  - Follow rows where EITHER follower or followee === preservedUserId → kept.
 *  - Exam: wiped wholesale (re-created in phase 4).
 */
export async function wipeAllExceptUser(
  preservedUserId: Types.ObjectId
): Promise<WipeReport> {
  const byCollection: Record<string, number> = {};

  // Order matters: leaf-y collections first, then exercises/users last so
  // foreign-key deletes don't fight an in-flight scan.

  byCollection.comments = (
    await Comment.deleteMany({ authorId: { $ne: preservedUserId } })
  ).deletedCount ?? 0;

  byCollection.solutions = (
    await Solution.deleteMany({ authorId: { $ne: preservedUserId } })
  ).deletedCount ?? 0;

  byCollection.exerciseLikes = (
    await ExerciseLike.deleteMany({ userId: { $ne: preservedUserId } })
  ).deletedCount ?? 0;

  byCollection.savedExercises = (
    await SavedExercise.deleteMany({ userId: { $ne: preservedUserId } })
  ).deletedCount ?? 0;

  byCollection.follows = (
    await Follow.deleteMany({
      $and: [
        { follower: { $ne: preservedUserId } },
        { followee: { $ne: preservedUserId } },
      ],
    })
  ).deletedCount ?? 0;

  byCollection.exercises = (
    await Exercise.deleteMany({ authorId: { $ne: preservedUserId } })
  ).deletedCount ?? 0;

  byCollection.exams = (await Exam.deleteMany({})).deletedCount ?? 0;

  byCollection.users = (
    await User.deleteMany({ _id: { $ne: preservedUserId } })
  ).deletedCount ?? 0;

  const preservedUser = await User.findById(preservedUserId).select('email').lean();
  return {
    byCollection,
    preserved: {
      userId: preservedUserId.toString(),
      email: preservedUser?.email ?? '(unknown)',
    },
  };
}
