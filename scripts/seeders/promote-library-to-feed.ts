/**
 * Promote 12 library BAC / BAC-blanc exercises (those carrying Cloudinary
 * figures) into the dashboard feed so users see real exam imagery alongside
 * community posts.
 *
 * Per promoted exercise we:
 *   - set `featured: true`
 *   - bump `lastActivityAt` to a random point inside the last 7 days
 *   - reassign `authorId` from the `import@bac-platform.system` user to a
 *     random verified teacher (never the preserved user
 *     `akramseddik25@gmail.com`)
 *
 * No other fields are touched (statement, parts, figures, examId, etc.).
 *
 * Selection is deterministic via mulberry32 with seed 195923302 from
 * `scripts/seeders/context.ts`, with topic/year variety constraints:
 *   - At least one figure with non-empty `cloudinaryUrl`
 *   - Prefer figures whose `context === 'question'`
 *   - Aim for ≥ 2 from each of `analyse`, `nombres_complexes`, `geometrie`,
 *     `probabilites` where the pool allows (geometrie has only 1 figure-
 *     bearing exercise as of writing — we take that single one).
 *   - Spread years where possible.
 *
 * Idempotent: re-running with ≥ 12 already-featured exercises is a no-op.
 *
 * Usage:
 *   npx tsx scripts/seeders/promote-library-to-feed.ts
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { Types } from 'mongoose';
import { connectToDatabase } from '../../src/lib/mongodb';
import Exercise from '../../src/models/Exercise';
import Exam from '../../src/models/Exam';
import User from '../../src/models/User';
import { mulberry32 } from './context';

const SEED = 195923302;
const TARGET_COUNT = 12;
const PRESERVED_EMAIL = 'akramseddik25@gmail.com';
const SYSTEM_EMAIL = 'import@bac-platform.system';

// Variety targets per topic (best-effort; capped by pool availability).
const TOPIC_TARGETS: ReadonlyArray<readonly [string, number]> = [
  ['analyse', 2],
  ['nombres_complexes', 2],
  ['geometrie', 2],
  ['probabilites', 2],
];

interface CandidateRow {
  _id: Types.ObjectId;
  topic: string;
  year: number | null;
  hasQuestionFigure: boolean;
}

/** Deterministic in-place Fisher-Yates using the seeded rng. */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function run() {
  await connectToDatabase();
  const rng = mulberry32(SEED);

  // Idempotency guard — never promote past TARGET_COUNT.
  const alreadyFeatured = await Exercise.countDocuments({ featured: true });
  if (alreadyFeatured >= TARGET_COUNT) {
    console.log(
      `✓ ${alreadyFeatured} exercises already featured (≥ ${TARGET_COUNT}). No-op.`
    );
    const total = await Exercise.countDocuments({ featured: true });
    console.log(`featured.count = ${total}`);
    return;
  }
  const slotsToFill = TARGET_COUNT - alreadyFeatured;

  // Resolve verified-teacher pool (excluding the preserved user).
  const preserved = await User.findOne({ email: PRESERVED_EMAIL })
    .select('_id')
    .lean();
  const preservedId = preserved?._id as Types.ObjectId | undefined;
  const teachers = await User.find({
    role: 'teacher',
    isVerifiedTeacher: true,
    ...(preservedId ? { _id: { $ne: preservedId } } : {}),
  })
    .select('_id name')
    .lean();
  if (teachers.length === 0) {
    throw new Error(
      'No verified teachers available to reassign authorship to. Seed users first.'
    );
  }
  console.log(
    `✓ Verified teacher pool: ${teachers.length} candidate(s)`
  );

  // Pull candidate library exercises: have figures with a non-empty
  // Cloudinary URL. Join their Exam to grab the year. Stamp whether any
  // figure has context === 'question' so we can rank.
  const rawCandidates = await Exercise.aggregate<{
    _id: Types.ObjectId;
    topic: string;
    year: number | null;
    hasQuestionFigure: boolean;
    alreadyFeatured: boolean;
  }>([
    {
      $match: {
        examId: { $exists: true },
        figures: {
          $elemMatch: {
            cloudinaryUrl: { $exists: true, $nin: [null, ''] },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'exams',
        localField: 'examId',
        foreignField: '_id',
        as: 'exam',
      },
    },
    { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        topic: 1,
        year: '$exam.year',
        alreadyFeatured: { $ifNull: ['$featured', false] },
        hasQuestionFigure: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ['$figures', []] },
                  as: 'f',
                  cond: {
                    $and: [
                      { $eq: ['$$f.context', 'question'] },
                      {
                        $and: [
                          { $ne: ['$$f.cloudinaryUrl', null] },
                          { $ne: ['$$f.cloudinaryUrl', ''] },
                        ],
                      },
                    ],
                  },
                },
              },
            },
            0,
          ],
        },
      },
    },
  ]);

  // Filter out anything already featured — we only need to fill empty slots.
  const candidates: CandidateRow[] = rawCandidates
    .filter((c) => !c.alreadyFeatured)
    .map((c) => ({
      _id: c._id,
      topic: c.topic,
      year: c.year ?? null,
      hasQuestionFigure: c.hasQuestionFigure,
    }));

  console.log(
    `✓ Candidate pool: ${candidates.length} figure-bearing library exercises`
  );

  // Deterministic shuffle. Stable order before shuffle: by _id string so the
  // seed maps the same way across runs.
  candidates.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
  const shuffled = shuffle(candidates, rng);

  // Within shuffled order, prefer items that have a `question`-context
  // figure so the feed-card preview shows the question imagery rather than
  // a solution figure. We do a *stable* partition to keep the deterministic
  // ordering from `shuffle` intact within each bucket.
  const questionFirst: CandidateRow[] = [
    ...shuffled.filter((c) => c.hasQuestionFigure),
    ...shuffled.filter((c) => !c.hasQuestionFigure),
  ];

  // Step 1: hit topic targets (best-effort, capped by pool availability)
  // with year-spread inside each topic.
  const selected: CandidateRow[] = [];
  const selectedIds = new Set<string>();
  const usedYearsByTopic = new Map<string, Set<number | null>>();

  function takeForTopic(topic: string, want: number): number {
    let taken = 0;
    const pool = questionFirst.filter((c) => c.topic === topic);
    // First pass: enforce year uniqueness within the topic.
    const yearsSeen = usedYearsByTopic.get(topic) ?? new Set<number | null>();
    for (const cand of pool) {
      if (taken >= want) break;
      if (selectedIds.has(cand._id.toString())) continue;
      if (yearsSeen.has(cand.year)) continue;
      selected.push(cand);
      selectedIds.add(cand._id.toString());
      yearsSeen.add(cand.year);
      taken += 1;
    }
    // Second pass: relax year uniqueness if we still need more.
    for (const cand of pool) {
      if (taken >= want) break;
      if (selectedIds.has(cand._id.toString())) continue;
      selected.push(cand);
      selectedIds.add(cand._id.toString());
      yearsSeen.add(cand.year);
      taken += 1;
    }
    usedYearsByTopic.set(topic, yearsSeen);
    return taken;
  }

  for (const [topic, target] of TOPIC_TARGETS) {
    const got = takeForTopic(topic, target);
    if (got < target) {
      console.log(
        `  • ${topic}: only ${got}/${target} available in pool — taking what we have`
      );
    }
  }

  // Step 2: fill remaining slots with any candidates, year-spread overall.
  const usedYearsOverall = new Set<number | null>();
  for (const c of selected) usedYearsOverall.add(c.year);

  function fillFromAll(pool: CandidateRow[]): void {
    for (const cand of pool) {
      if (selected.length >= slotsToFill) break;
      if (selectedIds.has(cand._id.toString())) continue;
      if (usedYearsOverall.has(cand.year)) continue;
      selected.push(cand);
      selectedIds.add(cand._id.toString());
      usedYearsOverall.add(cand.year);
    }
  }
  fillFromAll(questionFirst);
  // Relax year uniqueness if still short.
  if (selected.length < slotsToFill) {
    for (const cand of questionFirst) {
      if (selected.length >= slotsToFill) break;
      if (selectedIds.has(cand._id.toString())) continue;
      selected.push(cand);
      selectedIds.add(cand._id.toString());
    }
  }

  console.log(
    `✓ Selected ${selected.length} exercise(s) for promotion`
  );
  if (selected.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  // Apply mutations. Each promoted exercise gets:
  //   featured = true
  //   lastActivityAt = now - random(0..7d)
  //   authorId = random verified teacher (deterministic via seeded rng)
  const now = Date.now();
  const breakdownByTopic = new Map<string, number>();
  const breakdownByYear = new Map<string, number>();
  let sampleId: string | null = null;

  for (const cand of selected) {
    const teacher = teachers[Math.floor(rng() * teachers.length)];
    const offsetMs = Math.floor(rng() * 7 * 86400000);
    const lastActivityAt = new Date(now - offsetMs);

    await Exercise.updateOne(
      { _id: cand._id },
      {
        $set: {
          featured: true,
          lastActivityAt,
          authorId: teacher._id as Types.ObjectId,
        },
      }
    );

    breakdownByTopic.set(
      cand.topic,
      (breakdownByTopic.get(cand.topic) ?? 0) + 1
    );
    const yearKey = cand.year === null ? 'unknown' : String(cand.year);
    breakdownByYear.set(yearKey, (breakdownByYear.get(yearKey) ?? 0) + 1);
    sampleId = sampleId ?? cand._id.toString();
  }

  // Verification log.
  const featuredCount = await Exercise.countDocuments({ featured: true });
  const systemUser = await User.findOne({ email: SYSTEM_EMAIL })
    .select('_id')
    .lean();
  const stillSystemAuthored = systemUser
    ? await Exercise.countDocuments({
        featured: true,
        authorId: systemUser._id as Types.ObjectId,
      })
    : 0;

  console.log('');
  console.log('────────────────────────────────────────');
  console.log(`featured.count = ${featuredCount}`);
  console.log(`promoted this run = ${selected.length}`);
  console.log(`still system-authored among featured = ${stillSystemAuthored}`);
  console.log('Topic breakdown:');
  for (const [topic, n] of [...breakdownByTopic.entries()].sort()) {
    console.log(`  ${topic}: ${n}`);
  }
  console.log('Year breakdown:');
  for (const [year, n] of [...breakdownByYear.entries()].sort()) {
    console.log(`  ${year}: ${n}`);
  }
  if (sampleId) console.log(`sample _id = ${sampleId}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ promote-library-to-feed failed:', err);
    process.exit(1);
  });
