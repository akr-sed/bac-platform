import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Follow from '@/models/Follow';

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

    // Counts are intentionally separate, cheap countDocuments calls
    // (each index-backed). Wave C1.
    const [exerciseCount, solutionCount, followersCount, followingCount] =
      await Promise.all([
        Exercise.countDocuments({ authorId: id }),
        Solution.countDocuments({ authorId: id }),
        Follow.countDocuments({ followee: id }),
        Follow.countDocuments({ follower: id }),
      ]);

    return NextResponse.json({
      user,
      exerciseCount,
      solutionCount,
      followersCount,
      followingCount,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
