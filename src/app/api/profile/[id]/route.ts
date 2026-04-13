import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectToDatabase();

    const user = await User.findById(id).select('-passwordHash').lean();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const [exerciseCount, solutionCount] = await Promise.all([
      Exercise.countDocuments({ authorId: id }),
      Solution.countDocuments({ authorId: id }),
    ]);

    return NextResponse.json({ user, exerciseCount, solutionCount });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
