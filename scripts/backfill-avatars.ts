/**
 * One-shot backfill: give every existing user a deterministic DiceBear avatar
 * if they don't already have one. Skips the human owner + the system import
 * account.
 *
 * Run with: `npx tsx scripts/backfill-avatars.ts`
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load .env.local explicitly (Next.js convention, not picked up by dotenv/config by default).
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { Types } from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';
import { buildAvatarUrl, type AvatarRole } from './seeders/data/avatars';

const PRESERVED_EMAILS = new Set([
  'akramseddik25@gmail.com',
  'import@bac-platform.system',
]);

interface BackfillCandidate {
  _id: Types.ObjectId;
  email: string;
  role: AvatarRole;
}

async function run() {
  await connectToDatabase();

  const filter = {
    email: { $nin: Array.from(PRESERVED_EMAILS) },
    $or: [
      { avatar: { $exists: false } },
      { avatar: null },
      { avatar: '' },
    ],
  };

  const candidates = await User.find(filter)
    .select('_id email role')
    .lean<BackfillCandidate[]>();

  console.log(`Found ${candidates.length} user(s) needing an avatar.`);

  const samples: { email: string; avatar: string }[] = [];
  let updated = 0;
  let failed = 0;

  for (const user of candidates) {
    if (!user.email) {
      failed += 1;
      continue;
    }
    const role: AvatarRole =
      user.role === 'teacher' || user.role === 'admin' ? user.role : 'student';
    const avatar = buildAvatarUrl(user.email, role);
    try {
      await User.updateOne({ _id: user._id }, { $set: { avatar } });
      updated += 1;
      if (samples.length < 3) {
        samples.push({ email: user.email, avatar });
      }
    } catch (err) {
      failed += 1;
      console.error(`✗ failed to update ${user.email}:`, err);
    }
  }

  console.log(`\n✓ Updated ${updated} user(s); ${failed} failure(s).`);
  if (samples.length > 0) {
    console.log('\nSample (email → avatar):');
    for (const s of samples) {
      console.log(`  ${s.email}\n    ${s.avatar}`);
    }
  }
}

run()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Close the cached mongoose connection so tsx exits cleanly.
    const mongoose = (await import('mongoose')).default;
    await mongoose.disconnect();
  });
