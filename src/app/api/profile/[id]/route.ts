import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Follow from '@/models/Follow';

// Email of the bulk-import service account. When viewing this user's own
// profile, hide their authored exercises (otherwise we'd dump every
// library-imported BAC exercise — hundreds of rows — on a single page).
const IMPORT_SYSTEM_EMAIL = 'import@bac-platform.system';

const PROFILE_LIST_LIMIT = 20;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate the ObjectId hex up-front. Mongoose would otherwise throw a
    // CastError that surfaces as a generic 500.
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user id' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(id).select('-passwordHash').lean();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isImportSystemUser =
      (user as { email?: string }).email === IMPORT_SYSTEM_EMAIL;

    // Counts are intentionally separate, cheap countDocuments calls
    // (each index-backed). Wave C1.
    const [exerciseCount, solutionCount, followersCount, followingCount] =
      await Promise.all([
        Exercise.countDocuments({ authorId: id }),
        Solution.countDocuments({ authorId: id }),
        Follow.countDocuments({ followee: id }),
        Follow.countDocuments({ follower: id }),
      ]);

    // Authored exercises. We skip the list for the import service account
    // viewing itself — hundreds of seeded exercises would otherwise come back.
    const exercises = isImportSystemUser
      ? []
      : await Exercise.find({ authorId: id })
          .sort({ createdAt: -1 })
          .limit(PROFILE_LIST_LIMIT)
          .select({ _id: 1, title: 1, difficulty: 1, createdAt: 1 })
          .lean();

    // Authored solutions, with the parent exercise title joined in. Use
    // populate so a deleted exercise leaves `exerciseTitle: null` instead of
    // dropping the row.
    type PopulatedSolution = {
      _id: Types.ObjectId;
      createdAt: Date;
      exerciseId: { title?: string } | null;
    };
    const solutionDocs = (await Solution.find({ authorId: id })
      .sort({ createdAt: -1 })
      .limit(PROFILE_LIST_LIMIT)
      .select({ _id: 1, createdAt: 1, exerciseId: 1 })
      .populate({ path: 'exerciseId', select: 'title' })
      .lean()) as unknown as PopulatedSolution[];

    const solutions = solutionDocs.map((s) => ({
      _id: s._id,
      createdAt: s.createdAt,
      exerciseTitle: s.exerciseId?.title ?? null,
    }));

    return NextResponse.json({
      user: {
        ...user,
        exercises,
        solutions,
      },
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
