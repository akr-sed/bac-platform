import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Exam, { type IExam } from '@/models/Exam';
import Exercise from '@/models/Exercise';

const ParsedExerciseSchema = z.object({
  id: z.string(),
  exam_id: z.string(),
  number: z.number().int().min(1),
  title: z.string().nullable().optional(),
  statement: z.string(),
  topic: z.string(),
  concepts: z.array(z.string()).optional().default([]),
  difficulty: z.string().nullable().optional(),
  marks: z.number().nullable().optional(),
  has_figure: z.boolean().optional().default(false),
  source_page: z.number().int().nullable().optional(),
  parts: z.array(z.unknown()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  solution: z.unknown().nullable().optional(),
});

const ParsedFigureSchema = z.object({
  id: z.string(),
  exam_id: z.string(),
  exercise_ref: z.number().int().min(1),
  part_ref: z.string().nullable().optional(),
  figure_type: z.string().optional(),
  description: z.string(),
  source_page: z.number().int().nullable().optional(),
});

const ImportPayloadSchema = z.object({
  exam_id: z.string().min(1),
  exercises: z.array(ParsedExerciseSchema).min(1),
  figures: z.array(ParsedFigureSchema).optional().default([]),
  // Importer-supplied metadata. Year/subject can be inferred but the importer should pass them.
  title: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  filename: z.string().optional(),
});

const VALID_DIFFICULTY = new Set(['easy', 'medium', 'hard']);

function normaliseDifficulty(value: string | null | undefined): 'easy' | 'medium' | 'hard' {
  if (value && VALID_DIFFICULTY.has(value)) return value as 'easy' | 'medium' | 'hard';
  return 'medium';
}

function inferYearFromFilename(filename: string | undefined): number | undefined {
  if (!filename) return undefined;
  const match = filename.match(/(19|20)\d{2}/);
  if (match) return parseInt(match[0], 10);
  return undefined;
}

export async function POST(request: NextRequest) {
  await connectToDatabase();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin' && session.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = ImportPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const subject = data.subject ?? 'math';
  const level = data.level ?? '3AS';
  const year =
    data.year ??
    inferYearFromFilename(data.filename) ??
    new Date().getFullYear();
  const title = data.title ?? `BAC ${year} — ${subject}`;
  const filename = data.filename ?? '';

  const createdExerciseIds: Types.ObjectId[] = [];
  let exam: IExam | null = null;

  try {
    exam = await Exam.create({
      title,
      year,
      subject,
      level,
      source: {
        filename,
        parsedExamId: data.exam_id,
      },
      exerciseIds: [],
      importedBy: session.userId,
    });

    for (const ex of data.exercises) {
      const figureDescriptions = data.figures
        .filter((f) => f.exercise_ref === ex.number)
        .map((f) => f.description)
        .filter((d) => d && d.length > 0);

      // Persist the topic slug verbatim. The render layer (exam page,
      // exercise detail page, import-form preview) resolves it via
      // `topicLabel(slug, locale)` so French/English viewers get the
      // right language. Storing the resolved Arabic label would lock
      // every viewer into Arabic regardless of locale.
      const exerciseDoc = await Exercise.create({
        title: ex.title?.trim() || `BAC ${year} — ${ex.topic} #${ex.number}`,
        description: ex.statement,
        subject,
        topic: ex.topic,
        subtopic: '',
        difficulty: normaliseDifficulty(ex.difficulty ?? null),
        authorId: session.userId,
        attachments: [],
        examId: exam._id,
        examNumber: ex.number,
        concepts: ex.concepts && ex.concepts.length > 0 ? ex.concepts : undefined,
        marks: ex.marks ?? undefined,
        sourcePage: ex.source_page ?? undefined,
        figureDescriptions: figureDescriptions.length > 0 ? figureDescriptions : undefined,
        // Strict math detection: require a matching pair of `$...$` or
        // `$$...$$`, ignoring escaped `\$`. A lone dollar sign (e.g. "$5")
        // does not flip the flag. Mirrors the splitter in math-text-splitter.ts.
        hasMath:
          /(?<!\\)\$\$[\s\S]+?\$\$/.test(ex.statement) ||
          /(?<!\\)\$[^$\n]+?\$/.test(ex.statement),
      });

      createdExerciseIds.push(exerciseDoc._id as Types.ObjectId);
    }

    exam.exerciseIds = createdExerciseIds;
    await exam.save();

    return NextResponse.json(
      {
        exam: {
          _id: String(exam._id),
          title: exam.title,
          year: exam.year,
          subject: exam.subject,
          level: exam.level,
          source: exam.source,
          exerciseIds: exam.exerciseIds.map((id: Types.ObjectId) => String(id)),
          importedBy: String(exam.importedBy),
          createdAt: exam.createdAt,
          updatedAt: exam.updatedAt,
        },
        exerciseIds: createdExerciseIds.map((id) => String(id)),
      },
      { status: 201 }
    );
  } catch (err) {
    // Best-effort rollback (no transactions — tolerate Atlas without replica sets).
    try {
      if (createdExerciseIds.length > 0) {
        await Exercise.deleteMany({ _id: { $in: createdExerciseIds } });
      }
      if (exam) {
        await Exam.findByIdAndDelete(exam._id);
      }
    } catch (rollbackErr) {
      console.error('Exam import rollback failed:', rollbackErr);
    }

    // MongoDB duplicate-key error → idempotency on `source.parsedExamId`.
    // The same parsed exam was already imported; surface as 409 so the
    // caller can choose to skip or update rather than create a duplicate.
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: 'Exam already imported' },
        { status: 409 }
      );
    }

    console.error('Exam import failed:', err);
    return NextResponse.json(
      { error: 'Server error while importing exam' },
      { status: 500 }
    );
  }
}
