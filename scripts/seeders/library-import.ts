import path from 'path';
import { promises as fs } from 'fs';
import { Types } from 'mongoose';
import Exercise, {
  type IFigureSubdoc,
  type IPartSubdoc,
  type FigureContext,
  type FigureType,
  type FiliereKey,
} from '../../src/models/Exercise';
import Exam from '../../src/models/Exam';
import type { SeedContext } from './context';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SOURCES: Array<{ dir: string; examType: 'bac' | 'bac_blanc' }> = [
  {
    dir: path.join(REPO_ROOT, 'data', 'dzexams', 'maths', 'bac', 'bac-results-new'),
    examType: 'bac',
  },
  {
    dir: path.join(
      REPO_ROOT, 'data', 'dzexams', 'maths', 'bac-blanc', 'bac-blanc-results-new'
    ),
    examType: 'bac_blanc',
  },
];
const MANIFEST_PATH = path.join(
  REPO_ROOT, 'data', 'dzexams', 'maths', 'bac', 'bac-figures-manifest.json'
);

interface ManifestEntry {
  localPath: string;
  publicId: string;
  secureUrl: string;
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
    return [{ exam_metadata: doc.exam_metadata, exercises: doc.exercises, figures: doc.figures ?? [] }];
  }
  return [];
}

function pathForFigure(meta: RawExamMetadata, exNumber: number, fig: RawFigure): string {
  const stem = path.parse(meta.source_file || 'unknown').name || 'unknown';
  const stemWithSujet = meta.sujet ? `${stem}__s${meta.sujet}` : stem;
  const context = (fig.context ?? 'question').toLowerCase();
  const fid = (fig.id || 'noid').slice(0, 8) || 'noid';
  return `${stemWithSujet}/ex${exNumber}/${context}__${fid}.png`;
}

async function loadManifest(): Promise<Manifest | null> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw) as Manifest;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

async function readJsonsIn(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith('.json') && !f.endsWith('.error.json'))
      .map((f) => path.join(dir, f));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}

export interface LibraryReport {
  examCount: number;
  exerciseCount: number;
  partCount: number;
  figureCount: number;
  missingFigures: number;
  manifestPresent: boolean;
}

export async function seedLibrary(ctx: SeedContext): Promise<LibraryReport> {
  const manifest = await loadManifest();
  const report: LibraryReport = {
    examCount: 0,
    exerciseCount: 0,
    partCount: 0,
    figureCount: 0,
    missingFigures: 0,
    manifestPresent: manifest !== null,
  };

  for (const source of SOURCES) {
    const files = await readJsonsIn(source.dir);
    for (const file of files) {
      const doc = JSON.parse(await fs.readFile(file, 'utf-8')) as RawDoc;
      const exams = flattenExams(doc);
      for (const exam of exams) {
        const meta = exam.exam_metadata;
        const sujetSuffix = meta.sujet ? ` — sujet ${meta.sujet}` : '';
        const title = `${source.examType === 'bac_blanc' ? 'BAC blanc' : 'BAC'} ${meta.year ?? '????'}${sujetSuffix}`;

        const examDoc = await Exam.create({
          title,
          year: meta.year ?? 0,
          subject: meta.subject || 'mathematics',
          level: '3AS',
          examType: source.examType,
          source: { filename: meta.source_file ?? '', parsedExamId: meta.id },
          exerciseIds: [],
          importedBy: ctx.systemUserId,
        });
        report.examCount += 1;

        for (const ex of exam.exercises) {
          // Drop parts with null/empty statements (some legacy / partial
          // extractions emit placeholder parts that violate the required
          // `statement` field on PartSubdocSchema).
          const parts: IPartSubdoc[] = (ex.parts ?? [])
            .filter((p) => typeof p.statement === 'string' && p.statement.trim().length > 0)
            .map((p, idx) => {
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
            const manifestEntry = manifest ? manifest[relPath] : null;
            if (!manifestEntry) {
              report.missingFigures += 1;
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

          // Some legacy / partially-extracted JSONs have null OR empty
          // string `statement` at the exercise level. `??` doesn't catch
          // empty strings, so we coerce-empty-to-undefined and fall through
          // to: first non-empty part statement → title → synthetic label.
          const nonEmpty = (s?: string | null): string | undefined => {
            const t = (s ?? '').trim();
            return t.length > 0 ? t : undefined;
          };
          const safeStatement: string =
            nonEmpty(ex.statement) ??
            nonEmpty(ex.parts?.find((p) => nonEmpty(p.statement))?.statement) ??
            nonEmpty(ex.title) ??
            `${ex.topic ?? 'BAC'} — exercise ${ex.number}`;
          const fallbackTitle = nonEmpty(ex.title) ?? `${ex.topic ?? 'BAC'} — ${ex.number}`;
          const description = safeStatement.slice(0, 280);
          const filiere = (meta.filiere ?? undefined) as FiliereKey | undefined;

          const created = await Exercise.create({
            title: fallbackTitle,
            description,
            difficulty: ex.difficulty,
            subject: meta.subject || 'mathematics',
            topic: ex.topic,
            subtopic: '',
            authorId: ctx.systemUserId,
            attachments: [],
            examId: examDoc._id,
            examNumber: ex.number,
            concepts: ex.concepts ?? [],
            marks: ex.marks ?? undefined,
            sourcePage: Array.isArray(ex.source_page) ? ex.source_page[0] : ex.source_page,
            hasMath: true,
            filiere,
            statement: safeStatement,
            parts: parts.length ? parts : undefined,
            figures: figs.length ? figs : undefined,
            sujet: meta.sujet ?? null,
            language: meta.language ?? null,
          });

          await Exam.findByIdAndUpdate(examDoc._id, { $push: { exerciseIds: created._id } });

          ctx.libraryExercises.push({
            _id: created._id as Types.ObjectId,
            authorId: ctx.systemUserId,
            topic: ex.topic,
            createdAt: created.createdAt,
          });

          report.exerciseCount += 1;
          report.partCount += parts.length;
          report.figureCount += figs.length;
        }
      }
    }
  }

  return report;
}
