import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load .env.local explicitly (Next.js convention, not picked up by dotenv/config by default).
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { connectToDatabase } from '../src/lib/mongodb';
import Exercise from '../src/models/Exercise';
import Solution from '../src/models/Solution';
import Comment from '../src/models/Comment';
import ExerciseLike from '../src/models/ExerciseLike';

async function run() {
  await connectToDatabase();
  const exercises = await Exercise.find();
  console.log(`Backfilling ${exercises.length} exercises…`);

  for (const ex of exercises) {
    const solutions = await Solution.find({ exerciseId: ex._id });
    const solutionIds = solutions.map((s) => s._id);
    const commentsCount = await Comment.countDocuments({ solutionId: { $in: solutionIds } });
    const likesCount = await ExerciseLike.countDocuments({ exerciseId: ex._id });

    const lastSolution = solutions.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )[0];
    const lastActivityAt = lastSolution?.updatedAt ?? ex.updatedAt;

    await Exercise.updateOne(
      { _id: ex._id },
      {
        $set: {
          solutionCount: solutions.length,
          commentsCount,
          likesCount,
          lastActivityAt,
        },
      }
    );
  }
  console.log('✓ Backfill complete');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
