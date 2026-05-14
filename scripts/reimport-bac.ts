/**
 * Wipe corpus exercises (those with examId set) and re-import them from
 * data/dzexams/maths/bac/bac-results-new/*.json with structured parts and
 * figures populated.
 *
 * Pre-reqs:
 *   1. python -m scripts.ai_hinting crop-all   (Piece A)
 *   2. npx tsx scripts/upload-figures-to-cloudinary.ts
 *
 * Usage:
 *   npx tsx scripts/reimport-bac.ts
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { Types } from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import Exercise, {
  type IFigureSubdoc,
  type IPartSubdoc,
  type FigureContext,
  type FigureType,
  type FiliereKey,
} from '../src/models/Exercise';
import Exam from '../src/models/Exam';
import User from '../src/models/User';

const REPO_ROOT = path.resolve(__dirname, '..');
const JSONS_DIR = path.join(
  REPO_ROOT,
  'data',
  'dzexams',
  'maths',
  'bac',
  'bac-results-new'
);
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  'data',
  'dzexams',
  'maths',
  'bac',
  'bac-figures-manifest.json'
);

const SYSTEM_USER_EMAIL = 'import@bac-platform.system';

interface ManifestEntry {
  localPath: string;
  publicId: string;
  secureUrl: string;
  uploadedAt: string;
}
type Manifest = Record<string, ManifestEntry>;

interface RawFigure {
  id: string;
  exercise_ref?: number;
  part_ref?: string | null;
  figure_type?: FigureType;
  description?: string;
  source_page?: number;
  bounding_box?: number[];
  context?: FigureContext | null;
}
interface RawPart {
  id: string;
  label?: string;
  sub_label?: string | null;
  statement: string;
  solution?: string | null;
  depends_on?: string[];
  marks?: number | null;
  has_figure?: boolean;
  ordering?: number;
}
interface RawExercise {
  id: string;
  number: number;
  title?: string | null;
  statement: string;
  topic: string;
  concepts?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  marks?: number | null;
  has_figure?: boolean;
  source_page?: number | number[];
  solution?: string | null;
  parts?: RawPart[];
}
interface RawExamMetadata {
  id: string;
  subject: string;
  source_file: string;
  exam_type?: string;
  session?: string | null;
  trimester?: number | null;
  filiere?: string | null;
  year?: number | null;
  language?: 'ar' | 'fr' | 'ar_fr' | null;
  sujet?: number | null;
}
interface RawExamObject {
  exam_metadata: RawExamMetadata;
  exercises: RawExercise[];
  figures: RawFigure[];
}
interface RawDoc {
  exams?: RawExamObject[];
  exam_metadata?: RawExamMetadata;
  exercises?: RawExercise[];
  figures?: RawFigure[];
}

function flattenExams(doc: RawDoc): RawExamObject[] {
  if (Array.isArray(doc.exams)) return doc.exams;
  if (doc.exam_metadata && doc.exercises) {
    return [
      {
        exam_metadata: doc.exam_metadata,
        exercises: doc.exercises,
        figures: doc.figures ?? [],
      },
    ];
  }
  return [];
}

function pathForFigure(
  examMeta: RawExamMetadata,
  exNumber: number,
  fig: RawFigure
): string {
  const stem = path.parse(examMeta.source_file || 'unknown').name || 'unknown';
  const stemWithSujet = examMeta.sujet ? `${stem}__s${examMeta.sujet}` : stem;
  const context = (fig.context ?? 'question').toLowerCase();
  const fid = (fig.id || 'noid').slice(0, 8) || 'noid';
  return `${stemWithSujet}/ex${exNumber}/${context}__${fid}.png`;
}

async function loadManifest(): Promise<Manifest> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw) as Manifest;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`error: manifest not found at ${MANIFEST_PATH}`);
      console.error('run `npx tsx scripts/upload-figures-to-cloudinary.ts` first.');
      process.exit(2);
    }
    throw e;
  }
}

async function ensureSystemUser(): Promise<Types.ObjectId> {
  const user = await User.findOneAndUpdate(
    { email: SYSTEM_USER_EMAIL },
    {
      $setOnInsert: {
        email: SYSTEM_USER_EMAIL,
        name: 'BAC Import',
        role: 'admin',
        passwordHash: 'disabled',
      },
    },
    { upsert: true, new: true }
  );
  return user._id as Types.ObjectId;
}

async function main(): Promise<void> {
  // Parse CLI flags.
  const args = process.argv.slice(2);
  const scoped = args.includes('--scoped');
  const limitFlagIdx = args.indexOf('--limit');
  const limit = limitFlagIdx !== -1 ? Number(args[limitFlagIdx + 1]) : null;

  await connectToDatabase();
  const manifest = await loadManifest();
  const systemUserId = await ensureSystemUser();

  // ── Pre-scan: collect parsedExamIds from JSONs so --scoped knows what to wipe.
  const allFiles = (await fs.readdir(JSONS_DIR)).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.error.json')
  );
  const files = limit !== null ? allFiles.slice(0, limit) : allFiles;
  const parsedExamIds: string[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(JSONS_DIR, file), 'utf-8');
    const doc = JSON.parse(raw) as RawDoc;
    for (const exam of flattenExams(doc)) {
      parsedExamIds.push(exam.exam_metadata.id);
    }
  }

  if (scoped) {
    // Per-exam wipe: only delete the Exams (and their Exercises) we're about
    // to re-insert. Leaves everything else (community exercises, other
    // imported exams) intact. Use this for safe previews.
    const existingExams = await Exam.find({
      'source.parsedExamId': { $in: parsedExamIds },
    }).select('_id');
    const examIdsToWipe = existingExams.map((e) => e._id);
    const wipeEx = await Exercise.deleteMany({ examId: { $in: examIdsToWipe } });
    const wipeExam = await Exam.deleteMany({ _id: { $in: examIdsToWipe } });
    console.log(
      `scoped wipe: removed ${wipeExam.deletedCount ?? 0} exams and ${wipeEx.deletedCount ?? 0} exercises`
    );
  } else {
    // Global wipe: every corpus exercise + every exam doc. Destructive — use
    // only for the real migration.
    const wipeRes = await Exercise.deleteMany({
      examId: { $exists: true, $ne: null },
    });
    await Exam.deleteMany({});
    console.log(`wiped ${wipeRes.deletedCount ?? 0} corpus exercises (global)`);
  }

  let examCount = 0;
  let exerciseCount = 0;
  let partCount = 0;
  let figureCount = 0;
  let missingFigures = 0;

  for (const file of files) {
    const full = path.join(JSONS_DIR, file);
    const doc = JSON.parse(await fs.readFile(full, 'utf-8')) as RawDoc;
    const exams = flattenExams(doc);
    for (const exam of exams) {
      const meta = exam.exam_metadata;
      const sujetSuffix = meta.sujet ? ` — sujet ${meta.sujet}` : '';
      const title = `BAC ${meta.year ?? '????'}${sujetSuffix}`;

      const rawType = meta.exam_type;
      const examType: 'bac' | 'bac_blanc' | 'trimestre' =
        rawType === 'bac_blanc' || rawType === 'trimestre' ? rawType : 'bac';

      const examDoc = await Exam.create({
        title,
        year: meta.year ?? 0,
        subject: meta.subject || 'mathematics',
        level: '3AS',
        examType,
        source: {
          filename: meta.source_file ?? '',
          parsedExamId: meta.id,
        },
        exerciseIds: [],
        importedBy: systemUserId,
      });
      examCount += 1;

      for (const ex of exam.exercises) {
        // partId must be unique within an exercise (used as React key on the
        // detail page). The Gemini extractor frequently reuses the same UUID
        // for every part of an exercise, so we suffix with ordering to
        // guarantee uniqueness.
        const parts: IPartSubdoc[] = (ex.parts ?? []).map((p, idx) => {
          const ordering = p.ordering ?? idx + 1;
          const shortId = (p.id || '').slice(0, 8) || 'noid';
          return {
            partId: `${shortId}-${ordering}`,
            label: String(p.label ?? ''),
            subLabel: p.sub_label ?? null,
            statement: p.statement,
            solution: p.solution ?? null,
            dependsOn: p.depends_on ?? [],
            marks: p.marks ?? null,
            hasFigure: Boolean(p.has_figure),
            ordering,
          };
        });

        const figs: IFigureSubdoc[] = [];
        for (const fig of exam.figures) {
          if (fig.exercise_ref !== ex.number) continue;
          const relPath = pathForFigure(meta, ex.number, fig);
          const manifestEntry = manifest[relPath];
          if (!manifestEntry) {
            missingFigures += 1;
            console.warn(`  ! missing manifest entry: ${relPath} (exercise ${ex.number})`);
            continue;
          }
          figs.push({
            figureId: (fig.id || '').slice(0, 8),
            cloudinaryUrl: manifestEntry.secureUrl,
            context: fig.context ?? 'question',
            figureType: fig.figure_type,
            description: fig.description ?? '',
            exerciseRef: fig.exercise_ref,
            partRef: fig.part_ref ?? null,
            sourcePage: fig.source_page,
            boundingBox:
              fig.bounding_box && fig.bounding_box.length === 4
                ? (fig.bounding_box as [number, number, number, number])
                : undefined,
          });
        }

        const fallbackTitle = ex.title ?? `${ex.topic} — ${ex.number}`;
        const description = ex.statement.slice(0, 280);
        const filiere = (meta.filiere ?? undefined) as FiliereKey | undefined;

        const created = await Exercise.create({
          title: fallbackTitle,
          description,
          difficulty: ex.difficulty,
          subject: meta.subject || 'mathematics',
          topic: ex.topic,
          subtopic: '',
          authorId: systemUserId,
          attachments: [],
          examId: examDoc._id,
          examNumber: ex.number,
          concepts: ex.concepts ?? [],
          marks: ex.marks ?? undefined,
          sourcePage: Array.isArray(ex.source_page)
            ? ex.source_page[0]
            : ex.source_page,
          hasMath: true,
          filiere,
          statement: ex.statement,
          parts: parts.length ? parts : undefined,
          figures: figs.length ? figs : undefined,
          sujet: meta.sujet ?? null,
          language: meta.language ?? null,
        });

        await Exam.findByIdAndUpdate(examDoc._id, {
          $push: { exerciseIds: created._id },
        });

        exerciseCount += 1;
        partCount += parts.length;
        figureCount += figs.length;
      }
    }
  }

  console.log(
    `\ndone. exams=${examCount} exercises=${exerciseCount} parts=${partCount} figures=${figureCount} missing_figures=${missingFigures}`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
