import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.userId).select('-passwordHash').lean();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const [exerciseCount, solutionCount] = await Promise.all([
      Exercise.countDocuments({ authorId: session.userId }),
      Solution.countDocuments({ authorId: session.userId }),
    ]);

    return NextResponse.json({ user, exerciseCount, solutionCount });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
