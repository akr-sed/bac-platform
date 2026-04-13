import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';

export async function GET() {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    // Fetch user info
    const user = await User.findById(userId)
      .select('-passwordHash -resetToken -resetTokenExpiry')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all stats + activity in a single parallel round
    const [
      exercisesPosted,
      solutionsSubmitted,
      commentsCount,
      likesReceivedAgg,
      recentExercises,
      recentSolutions,
      recentComments,
    ] = await Promise.all([
      Exercise.countDocuments({ authorId: userId }),
      Solution.countDocuments({ authorId: userId }),
      Comment.countDocuments({ authorId: userId }),
      Solution.aggregate([
        { $match: { authorId: user._id } },
        { $project: { likesCount: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$likesCount' } } },
      ]),
      Exercise.find({ authorId: userId })
        .select('title createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Solution.find({ authorId: userId })
        .select('exerciseId createdAt')
        .populate({ path: 'exerciseId', select: 'title' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Comment.find({ authorId: userId })
        .select('solutionId content createdAt')
        .populate({
          path: 'solutionId',
          select: 'exerciseId',
          populate: { path: 'exerciseId', select: 'title' },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const likesReceived =
      likesReceivedAgg.length > 0 ? likesReceivedAgg[0].total : 0;

    // Merge and sort all activity items
    const activityItems: {
      type: 'exercise' | 'solution' | 'comment';
      title: string;
      targetId: string;
      createdAt: Date;
    }[] = [];

    for (const ex of recentExercises) {
      activityItems.push({
        type: 'exercise',
        title: ex.title,
        targetId: ex._id.toString(),
        createdAt: ex.createdAt,
      });
    }

    for (const sol of recentSolutions) {
      const exerciseDoc = sol.exerciseId as unknown as {
        _id: unknown;
        title?: string;
      };
      activityItems.push({
        type: 'solution',
        title: exerciseDoc?.title || 'Unknown exercise',
        targetId: sol._id.toString(),
        createdAt: sol.createdAt,
      });
    }

    for (const comment of recentComments) {
      const solutionDoc = comment.solutionId as unknown as {
        exerciseId?: { _id: unknown; title?: string };
      };
      activityItems.push({
        type: 'comment',
        title: solutionDoc?.exerciseId?.title || 'Unknown exercise',
        targetId: comment._id.toString(),
        createdAt: comment.createdAt,
      });
    }

    // Sort by createdAt desc and take top 10
    activityItems.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const recentActivity = activityItems.slice(0, 10);

    // Points breakdown (simplified heuristic based on counts)
    // In a real system, points would be tracked per action.
    // Here we estimate: 5 pts per solution, 2 pts per comment, 1 pt per like received
    const pointsBreakdown = {
      fromSolutions: solutionsSubmitted * 5,
      fromComments: commentsCount * 2,
      fromLikes: likesReceived * 1,
    };

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        isVerifiedTeacher: user.isVerifiedTeacher,
        createdAt: user.createdAt,
      },
      stats: {
        exercisesPosted,
        solutionsSubmitted,
        commentsCount,
        likesReceived,
      },
      recentActivity,
      pointsBreakdown,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
