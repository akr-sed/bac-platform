import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import User from '../../src/models/User';
import { FIRST_NAMES, LAST_NAMES } from './data/algerian-names';
import { buildAvatarUrl } from './data/avatars';
import { type SeedContext, type SeededUser, pick, weightedPick, recentDate } from './context';

const DEV_PASSWORD = 'bac-platform-dev-2026!';

const FILIERES = [
  'mathematiques',
  'sciences-experimentales',
  'lettres-philosophie',
  'langues-etrangeres',
  'gestion-economie',
] as const;

export interface FakeUsersReport {
  total: number;
  teachers: number;
  verifiedTeachers: number;
  students: number;
}

/** Phase 3: create N fake users. Roles weighted 27% teacher / 73% student.
 *  ~60% of teachers are verified. All share `DEV_PASSWORD` for log-in testing. */
export async function seedFakeUsers(
  ctx: SeedContext,
  totalCount: number
): Promise<FakeUsersReport> {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  let teachers = 0;
  let students = 0;
  let verifiedTeachers = 0;
  const created: SeededUser[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < totalCount; i++) {
    const first = pick(FIRST_NAMES, ctx.rng);
    const last = pick(LAST_NAMES, ctx.rng);
    const role = weightedPick<'student' | 'teacher'>(
      [['teacher', 0.27], ['student', 0.73]],
      ctx.rng
    );
    const isVerifiedTeacher = role === 'teacher' && ctx.rng() < 0.6;
    const filiere = weightedPick<typeof FILIERES[number]>(
      [
        ['mathematiques', 0.5],
        ['sciences-experimentales', 0.2],
        ['lettres-philosophie', 0.1],
        ['langues-etrangeres', 0.1],
        ['gestion-economie', 0.1],
      ],
      ctx.rng
    );

    let suffix = i + 1;
    let email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@bac-platform.dev`;
    while (usedEmails.has(email)) {
      suffix += 1;
      email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@bac-platform.dev`;
    }
    usedEmails.add(email);

    const points =
      role === 'teacher'
        ? 100 + Math.floor(ctx.rng() * 600)
        : Math.floor(ctx.rng() * 500);

    const doc = await User.create({
      name: `${first} ${last}`,
      email,
      passwordHash,
      role,
      isVerifiedTeacher,
      points,
      avatar: buildAvatarUrl(email, role),
      emailVerifiedAt: recentDate(180, ctx.rng),
      preferences: {
        subjects: ['mathematics'],
        stream: filiere,
      },
      onboardedAt: recentDate(180, ctx.rng),
      createdAt: recentDate(180, ctx.rng),
    });

    if (role === 'teacher') {
      teachers += 1;
      if (isVerifiedTeacher) verifiedTeachers += 1;
    } else {
      students += 1;
    }

    created.push({
      _id: doc._id as Types.ObjectId,
      name: doc.name,
      email: doc.email,
      role,
      isVerifiedTeacher,
      filiere,
    });
  }

  // System import user for library-imported exercises.
  const systemUser = await User.findOneAndUpdate(
    { email: 'import@bac-platform.system' },
    {
      $setOnInsert: {
        email: 'import@bac-platform.system',
        name: 'BAC Import',
        role: 'admin',
        passwordHash: 'disabled',
      },
    },
    { upsert: true, new: true }
  );
  ctx.systemUserId = systemUser._id as Types.ObjectId;

  ctx.users.push(...created);
  return { total: created.length, teachers, verifiedTeachers, students };
}

export { DEV_PASSWORD };
