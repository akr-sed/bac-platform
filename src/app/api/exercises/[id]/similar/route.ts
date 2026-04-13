import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    const exercise = await Exercise.findById(id).lean();
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Find exercises that share the same subject AND (same topic OR same difficulty)
    const similarExercises = await Exercise.find({
      _id: { $ne: exercise._id },
      subject: exercise.subject,
      $or: [
        { topic: exercise.topic },
        { difficulty: exercise.difficulty },
      ],
    })
      .populate({
        path: 'authorId',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const exerciseIds = similarExercises.map((e) => e._id);
    const solutionCounts = await Solution.aggregate([
      { $match: { exerciseId: { $in: exerciseIds } } },
      { $group: { _id: '$exerciseId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      solutionCounts.map((s) => [s._id.toString(), s.count])
    );

    const data = similarExercises.map((ex) => ({
      _id: ex._id.toString(),
      title: ex.title,
      description: ex.description,
      difficulty: ex.difficulty,
      subject: ex.subject,
      topic: ex.topic,
      subtopic: ex.subtopic,
      author: ex.authorId,
      attachments: ex.attachments,
      solutionCount: countMap.get(ex._id.toString()) || 0,
      createdAt: ex.createdAt,
      updatedAt: ex.updatedAt,
    }));

    return NextResponse.json({ data, source: 'database' });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
