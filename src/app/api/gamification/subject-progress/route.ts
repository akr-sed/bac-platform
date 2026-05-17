import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Solution from '@/models/Solution';
import Exercise from '@/models/Exercise';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.userId);

    // Get exercises solved by the user (via solutions) grouped by subject
    const [solvedBySubject, totalBySubject] = await Promise.all([
      Solution.aggregate([
        { $match: { authorId: userId } },
        {
          $lookup: {
            from: 'exercises',
            localField: 'exerciseId',
            foreignField: '_id',
            as: 'exercise',
          },
        },
        { $unwind: '$exercise' },
        {
          $group: {
            _id: '$exercise.subject',
            completed: { $addToSet: '$exerciseId' },
          },
        },
        {
          $project: {
            subject: '$_id',
            completed: { $size: '$completed' },
          },
        },
      ]),
      Exercise.aggregate([
        { $group: { _id: '$subject', total: { $sum: 1 } } },
        { $project: { subject: '$_id', total: 1 } },
      ]),
    ]);

    const totalMap = new Map(
      totalBySubject.map((t: { subject: string; total: number }) => [t.subject, t.total])
    );

    const result = solvedBySubject.map((s: { subject: string; completed: number }) => {
      const total = totalMap.get(s.subject) ?? 0;
      return {
        subject: s.subject,
        completed: s.completed,
        total,
        pct: total > 0 ? Math.round((s.completed / total) * 100) : 0,
      };
    });

    // Sort by completed desc
    result.sort((a, b) => b.completed - a.completed);

    return NextResponse.json({ subjects: result });
  } catch (err) {
    console.error('[gamification/subject-progress]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
