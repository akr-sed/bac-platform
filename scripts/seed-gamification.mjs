/**
 * Idempotent seed script for gamification catalog data.
 * Usage: node scripts/seed-gamification.mjs
 *
 * Requires MONGODB_URI env var (or falls back to local bac-test).
 */
import { MongoClient } from 'mongodb';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bac-test';

const ACHIEVEMENTS = [
  {
    key: 'first-exercise',
    titleKey: 'gamification.achievements.first-exercise.title',
    descriptionKey: 'gamification.achievements.first-exercise.description',
    icon: 'Rocket',
    rarity: 'rare',
    xpReward: 50,
  },
  {
    key: 'streak-7',
    titleKey: 'gamification.achievements.streak-7.title',
    descriptionKey: 'gamification.achievements.streak-7.description',
    icon: 'Flame',
    rarity: 'rare',
    xpReward: 100,
  },
  {
    key: 'streak-30',
    titleKey: 'gamification.achievements.streak-30.title',
    descriptionKey: 'gamification.achievements.streak-30.description',
    icon: 'Zap',
    rarity: 'epic',
    xpReward: 500,
  },
  {
    key: 'level-5',
    titleKey: 'gamification.achievements.level-5.title',
    descriptionKey: 'gamification.achievements.level-5.description',
    icon: 'Star',
    rarity: 'common',
    xpReward: 50,
  },
  {
    key: 'comments-50',
    titleKey: 'gamification.achievements.comments-50.title',
    descriptionKey: 'gamification.achievements.comments-50.description',
    icon: 'MessageSquare',
    rarity: 'rare',
    xpReward: 75,
  },
  {
    key: 'top-100',
    titleKey: 'gamification.achievements.top-100.title',
    descriptionKey: 'gamification.achievements.top-100.description',
    icon: 'Trophy',
    rarity: 'legendary',
    xpReward: 250,
  },
];

const DAILY_QUESTS = [
  {
    key: 'comment-3',
    titleKey: 'gamification.quests.comment-3.title',
    goal: 3,
    rewardXp: 30,
    active: true,
  },
  {
    key: 'solve-1',
    titleKey: 'gamification.quests.solve-1.title',
    goal: 1,
    rewardXp: 50,
    active: true,
  },
  {
    key: 'post-1',
    titleKey: 'gamification.quests.post-1.title',
    goal: 1,
    rewardXp: 100,
    active: true,
  },
];

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();

    // Upsert achievements
    const achCol = db.collection('achievements');
    for (const ach of ACHIEVEMENTS) {
      await achCol.updateOne(
        { key: ach.key },
        { $set: { ...ach, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      console.log(`[achievement] upserted: ${ach.key}`);
    }

    // Upsert daily quests
    const questCol = db.collection('dailyquests');
    for (const quest of DAILY_QUESTS) {
      await questCol.updateOne(
        { key: quest.key },
        { $set: { ...quest, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      console.log(`[daily-quest] upserted: ${quest.key}`);
    }

    console.log('\nSeed complete.');
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
