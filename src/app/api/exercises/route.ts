import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { cloudinaryTransform } from '@/lib/cloudinary';
import { getSession } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import ExerciseLike from '@/models/ExerciseLike';
import SavedExercise from '@/models/SavedExercise';

const createExerciseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  subject: z.string().min(1),
  topic: z.string().min(1),
  subtopic: z.string().optional().default(''),
  attachments: z.array(z.string()).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getSession();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const source = searchParams.get('source'); // 'community' | 'library' | null (= both)
    const filiere = searchParams.get('filiere');
    const featured = searchParams.get('featured');

    const filter: Record<string, unknown> = {};

    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (source === 'community') filter.examId = { $exists: false };
    if (source === 'library') filter.examId = { $exists: true };
    if (filiere) filter.filiere = filiere;
    if (featured === '1' || featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [exercises, total] = await Promise.all([
      Exercise.find(filter)
        .populate({
          path: 'authorId',
          select: 'name email role points isVerifiedTeacher avatar createdAt',
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Exercise.countDocuments(filter),
    ]);

    const exerciseIds = exercises.map((e) => e._id);
    const solutionCounts = await Solution.aggregate([
      { $match: { exerciseId: { $in: exerciseIds } } },
      { $group: { _id: '$exerciseId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      solutionCounts.map((s) => [s._id.toString(), s.count])
    );

    let likedSet = new Set<string>();
    let savedSet = new Set<string>();
    if (session) {
      const userObjectId = new Types.ObjectId(session.userId);
      const [likes, saves] = await Promise.all([
        ExerciseLike.find({
          userId: userObjectId,
          exerciseId: { $in: exerciseIds },
        }).select('exerciseId'),
        SavedExercise.find({
          userId: userObjectId,
          exerciseId: { $in: exerciseIds },
        }).select('exerciseId'),
      ]);
      likedSet = new Set(likes.map((l) => String(l.exerciseId)));
      savedSet = new Set(saves.map((s) => String(s.exerciseId)));
    }

    const data = exercises.map((exercise) => {
      const id = exercise._id.toString();
      const firstQuestionFigure = exercise.figures?.find(
        (f) => f.context === 'question'
      );
      const previewFigure = firstQuestionFigure
        ? {
            url: cloudinaryTransform(
              firstQuestionFigure.cloudinaryUrl,
              'c_fill,w_640,h_400,q_auto,f_auto'
            ),
            alt: firstQuestionFigure.description || exercise.title,
          }
        : null;
      return {
        _id: id,
        title: exercise.title,
        description: exercise.description,
        difficulty: exercise.difficulty,
        subject: exercise.subject,
        topic: exercise.topic,
        subtopic: exercise.subtopic,
        author: exercise.authorId,
        attachments: exercise.attachments,
        solutionCount: countMap.get(id) || 0,
        likesCount: exercise.likesCount ?? 0,
        commentsCount: exercise.commentsCount ?? 0,
        lastActivityAt: exercise.lastActivityAt ?? exercise.createdAt,
        isLiked: likedSet.has(id),
        isSaved: savedSet.has(id),
        previewFigure,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
      };
    });

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createExerciseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const exercise = await Exercise.create({
      ...result.data,
      authorId: session.userId,
    });

    const populated = await Exercise.findById(exercise._id)
      .populate({
        path: 'authorId',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .lean();

    if (!populated) {
      return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
    }

    return NextResponse.json(
      {
        _id: populated._id.toString(),
        title: populated.title,
        description: populated.description,
        difficulty: populated.difficulty,
        subject: populated.subject,
        topic: populated.topic,
        subtopic: populated.subtopic,
        author: populated.authorId,
        attachments: populated.attachments,
        solutionCount: 0,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
