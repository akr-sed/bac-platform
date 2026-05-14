import Exercise from '../../src/models/Exercise';
import ExerciseLike from '../../src/models/ExerciseLike';
import SavedExercise from '../../src/models/SavedExercise';
import Follow from '../../src/models/Follow';
import { type SeedContext, pickN } from './context';

export interface EngagementReport {
  likes: number;
  saves: number;
  follows: number;
}

export async function seedEngagement(ctx: SeedContext): Promise<EngagementReport> {
  let totalLikes = 0;
  let totalSaves = 0;
  let totalFollows = 0;

  // Likes + saves on community exercises only — corpus exercises stay clean.
  for (const ex of ctx.communityExercises) {
    const eligibleLikers = ctx.users.filter((u) => !u._id.equals(ex.authorId));
    const nLikes = 2 + Math.floor(ctx.rng() * 14);
    const likers = pickN(eligibleLikers, Math.min(nLikes, eligibleLikers.length), ctx.rng);
    for (const liker of likers) {
      try {
        await ExerciseLike.create({ userId: liker._id, exerciseId: ex._id });
        totalLikes += 1;
      } catch {
        /* duplicate (unique index) — skip */
      }
    }
    if (likers.length > 0) {
      await Exercise.findByIdAndUpdate(ex._id, { likesCount: likers.length });
    }

    const nSaves = Math.floor(ctx.rng() * 6);
    const savers = pickN(eligibleLikers, Math.min(nSaves, eligibleLikers.length), ctx.rng);
    for (const saver of savers) {
      try {
        await SavedExercise.create({ userId: saver._id, exerciseId: ex._id });
        totalSaves += 1;
      } catch {
        /* duplicate */
      }
    }
  }

  // Follows: each fake user follows 1-4 others (not themselves).
  for (const user of ctx.users) {
    const nFollows = 1 + Math.floor(ctx.rng() * 4);
    const others = ctx.users.filter((u) => !u._id.equals(user._id));
    const followees = pickN(others, Math.min(nFollows, others.length), ctx.rng);
    for (const followee of followees) {
      try {
        await Follow.create({ follower: user._id, followee: followee._id });
        totalFollows += 1;
      } catch {
        /* duplicate (unique compound index) */
      }
    }
  }

  return { likes: totalLikes, saves: totalSaves, follows: totalFollows };
}
