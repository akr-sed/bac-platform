import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load .env.local explicitly (Next.js convention, not picked up by dotenv/config by default).
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';
import Exercise from '../src/models/Exercise';
import Solution from '../src/models/Solution';
import Comment from '../src/models/Comment';

const SUBJECTS = ['math', 'physics', 'chemistry', 'biology', 'arabic-lit'];
const TOPICS: Record<string, string[]> = {
  math: ['integrals', 'sequences', 'functions', 'geometry'],
  physics: ['mechanics', 'waves', 'electromagnetism', 'thermodynamics'],
  chemistry: ['organic', 'acids-bases', 'kinetics'],
  biology: ['genetics', 'ecology', 'immunology'],
  'arabic-lit': ['poetry', 'prose', 'rhetoric'],
};
const DIFFS = ['easy', 'medium', 'hard'] as const;

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

async function run() {
  await connectToDatabase();
  const authors = await User.find().limit(30);
  if (authors.length === 0) throw new Error('No users — seed users first');

  const docs: any[] = [];
  for (let i = 0; i < 100; i++) {
    const subject = rand(SUBJECTS);
    docs.push({
      title: `Sample exercise ${i + 1} — ${rand(TOPICS[subject])}`,
      description: `Generated seed description for exercise ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      difficulty: rand(DIFFS as unknown as string[]),
      subject,
      topic: rand(TOPICS[subject]),
      subtopic: '',
      authorId: rand(authors)._id,
      attachments: [],
      createdAt: daysAgo(randInt(0, 30)),
      updatedAt: daysAgo(randInt(0, 30)),
    });
  }
  const created = await Exercise.insertMany(docs);

  for (const ex of created) {
    const solCount = randInt(0, 5);
    for (let s = 0; s < solCount; s++) {
      const sol = await Solution.create({
        exerciseId: ex._id,
        authorId: rand(authors)._id,
        content: `Sample solution for ${ex.title}`,
        images: [],
        likes: Array.from({ length: randInt(0, 15) }, () => rand(authors)._id),
      });
      const cCount = randInt(0, 10);
      for (let c = 0; c < cCount; c++) {
        await Comment.create({
          solutionId: sol._id,
          authorId: rand(authors)._id,
          content: `Seed comment ${c}`,
        });
      }
    }
  }

  console.log(`✓ Seeded ${created.length} exercises`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
