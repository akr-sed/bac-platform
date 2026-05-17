/**
 * Production seeder for the BAC platform.
 *
 * Usage:
 *   npx tsx scripts/seed-production.ts --confirm
 *   npx tsx scripts/seed-production.ts --confirm --keep-user-email someone@else.com
 *   npx tsx scripts/seed-production.ts --confirm --small
 *   npx tsx scripts/seed-production.ts --confirm --skip-library
 *   npx tsx scripts/seed-production.ts --confirm --skip-community
 *   npx tsx scripts/seed-production.ts --confirm --random-seed 42
 *
 * Without --confirm: prints what would happen and exits 0.
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { Types } from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';

import { mulberry32, type SeedContext } from './seeders/context';
import { wipeAllExceptUser } from './seeders/wipe';
import { seedFakeUsers, DEV_PASSWORD } from './seeders/fake-users';
import { seedLibrary } from './seeders/library-import';
import { seedCommunityExercises } from './seeders/community-exercises';
import { seedSolutions } from './seeders/solutions';
import { seedComments } from './seeders/comments';
import { seedEngagement } from './seeders/engagement';
import { seedSessions } from './seeders/sessions';

interface CliFlags {
  confirm: boolean;
  keepEmail: string;
  small: boolean;
  skipLibrary: boolean;
  skipCommunity: boolean;
  randomSeed: number;
}

function parseArgs(): CliFlags {
  const args = process.argv.slice(2);
  const has = (k: string) => args.includes(k);
  const val = (k: string, fallback: string): string => {
    const idx = args.indexOf(k);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
  };
  return {
    confirm: has('--confirm'),
    keepEmail: val('--keep-user-email', 'akramseddik25@gmail.com'),
    small: has('--small'),
    skipLibrary: has('--skip-library'),
    skipCommunity: has('--skip-community'),
    randomSeed: Number(val('--random-seed', '195923302')),
  };
}

async function main(): Promise<void> {
  const flags = parseArgs();
  await connectToDatabase();

  const preserved = await User.findOne({ email: flags.keepEmail }).select('_id email');
  if (!preserved) {
    console.error(`error: preserve target user '${flags.keepEmail}' not found in DB.`);
    console.error('Pass --keep-user-email <email> or create the user first.');
    process.exit(2);
  }

  if (!flags.confirm) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' BAC PLATFORM — PRODUCTION SEEDER (dry-run)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(` Preserve user:   ${flags.keepEmail} (${preserved._id})`);
    console.log(` Small mode:      ${flags.small}`);
    console.log(` Skip library:    ${flags.skipLibrary}`);
    console.log(` Skip community:  ${flags.skipCommunity}`);
    console.log(` Random seed:     ${flags.randomSeed}`);
    console.log('');
    console.log(' Re-run with --confirm to actually wipe and seed.');
    process.exit(0);
  }

  const totalUsers = flags.small ? 10 : 30;
  const totalCommunity = flags.small ? 15 : 40;

  const ctx: SeedContext = {
    preservedUserId: preserved._id as Types.ObjectId,
    systemUserId: new Types.ObjectId(), // overwritten by seedFakeUsers
    rng: mulberry32(flags.randomSeed),
    options: {
      small: flags.small,
      skipLibrary: flags.skipLibrary,
      skipCommunity: flags.skipCommunity,
    },
    users: [],
    libraryExercises: [],
    communityExercises: [],
    solutions: [],
    counts: {},
  };

  console.log('━━━ phase 2: wipe ━━━');
  const wipeReport = await wipeAllExceptUser(ctx.preservedUserId);
  console.log(' wiped:', wipeReport.byCollection);
  console.log(` preserved: ${wipeReport.preserved.email} (${wipeReport.preserved.userId})`);

  console.log('\n━━━ phase 3: users ━━━');
  const usersReport = await seedFakeUsers(ctx, totalUsers);
  console.log(` ${usersReport.total} users (${usersReport.teachers} teachers, ${usersReport.verifiedTeachers} verified, ${usersReport.students} students)`);
  console.log(` dev password (for all fake users): ${DEV_PASSWORD}`);

  if (!ctx.options.skipLibrary) {
    console.log('\n━━━ phase 4: library ━━━');
    const libReport = await seedLibrary(ctx);
    console.log(` ${libReport.examCount} exams, ${libReport.exerciseCount} exercises, ${libReport.partCount} parts, ${libReport.figureCount} figures attached`);
    if (!libReport.manifestPresent) {
      console.log(' ⚠  Cloudinary manifest missing — exercises imported without figure URLs.');
    }
    if (libReport.missingFigures > 0) {
      console.log(` ⚠  ${libReport.missingFigures} figures referenced but absent from manifest`);
    }
  } else {
    console.log('\n━━━ phase 4: library SKIPPED (--skip-library) ━━━');
  }

  if (!ctx.options.skipCommunity) {
    console.log('\n━━━ phase 5: community exercises ━━━');
    const commReport = await seedCommunityExercises(ctx, totalCommunity);
    console.log(` ${commReport.total} community posts (ar=${commReport.byLocale.ar}, fr=${commReport.byLocale.fr})`);

    console.log('\n━━━ phase 6: solutions ━━━');
    const solReport = await seedSolutions(ctx);
    console.log(` ${solReport.total} solutions on ${solReport.exercisesWithSolutions} exercises (${solReport.official} official)`);

    console.log('\n━━━ phase 7: comments ━━━');
    const commentsReport = await seedComments(ctx);
    console.log(` ${commentsReport.total} comments — kinds: ${JSON.stringify(commentsReport.byKind)}`);

    console.log('\n━━━ phase 8: engagement ━━━');
    const engReport = await seedEngagement(ctx);
    console.log(` ${engReport.likes} likes, ${engReport.saves} saves, ${engReport.follows} follows`);
  } else {
    console.log('\n━━━ phase 5-8 SKIPPED (--skip-community) ━━━');
  }

  console.log('\n━━━ phase 9: live sessions ━━━');
  const sessionsReport = await seedSessions(ctx);
  console.log(
    ` ${sessionsReport.total} sessions, ${sessionsReport.enrollments} enrollments`
  );
  console.log(`  by status: ${JSON.stringify(sessionsReport.byStatus)}`);
  console.log(`  by topic:  ${JSON.stringify(sessionsReport.byTopic)}`);
  console.log(
    `  ${sessionsReport.freeSessions} free / ${sessionsReport.paidSessions} paid, ${sessionsReport.linkedExercises} library exercises linked`
  );

  console.log('\n━━━ done ━━━');
  console.log(' Sign in as any seeded user with:');
  console.log(`   email: <firstname>.<lastname>1@bac-platform.dev`);
  console.log(`   password: ${DEV_PASSWORD}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
