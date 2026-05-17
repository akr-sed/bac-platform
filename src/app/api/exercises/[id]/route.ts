import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { destroyManyByUrl } from '@/lib/cloudinary';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';
import SavedExercise from '@/models/SavedExercise';
import ExerciseLike from '@/models/ExerciseLike';

const updateExerciseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  subject: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  subtopic: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    const exercise = await Exercise.findById(id)
      .populate({
        path: 'authorId',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .lean();

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const solutionCount = await Solution.countDocuments({ exerciseId: id });

    return NextResponse.json({
      _id: exercise._id.toString(),
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty,
      subject: exercise.subject,
      topic: exercise.topic,
      subtopic: exercise.subtopic,
      author: exercise.authorId,
      attachments: exercise.attachments,
      solutionCount,
      examId: exercise.examId ? String(exercise.examId) : undefined,
      examNumber: exercise.examNumber,
      concepts: exercise.concepts,
      marks: exercise.marks,
      sourcePage: exercise.sourcePage,
      figureDescriptions: exercise.figureDescriptions,
      hasMath: exercise.hasMath ?? false,
      // Structured corpus fields (undefined for community-posted exercises).
      statement: exercise.statement,
      parts: exercise.parts,
      figures: exercise.figures,
      sujet: exercise.sujet ?? null,
      language: exercise.language ?? null,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    if (
      exercise.authorId.toString() !== session.userId &&
      session.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateExerciseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await Exercise.findByIdAndUpdate(id, result.data, {
      new: true,
    })
      .populate({
        path: 'authorId',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .lean();

    if (!updated) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const solutionCount = await Solution.countDocuments({ exerciseId: id });

    return NextResponse.json({
      _id: updated._id.toString(),
      title: updated.title,
      description: updated.description,
      difficulty: updated.difficulty,
      subject: updated.subject,
      topic: updated.topic,
      subtopic: updated.subtopic,
      author: updated.authorId,
      attachments: updated.attachments,
      solutionCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    if (
      exercise.authorId.toString() !== session.userId &&
      session.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const solutions = await Solution.find({ exerciseId: id }).select('_id images');
    const solutionIds = solutions.map((s) => s._id);
    const solutionMediaUrls = solutions.flatMap((s) => s.images ?? []);
    const exerciseMediaUrls = exercise.attachments ?? [];

    await Comment.deleteMany({ solutionId: { $in: solutionIds } });
    await Solution.deleteMany({ exerciseId: id });
    await SavedExercise.deleteMany({ exerciseId: id });
    await ExerciseLike.deleteMany({ exerciseId: id });
    await Exercise.findByIdAndDelete(id);

    // Best-effort Cloudinary cleanup after DB delete succeeds. Failures here
    // are logged but never roll back the user-visible deletion — orphaned
    // assets can be reaped by a scheduled sweep if needed.
    await destroyManyByUrl([...exerciseMediaUrls, ...solutionMediaUrls]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
