import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Solution from '@/models/Solution';
import User from '@/models/User';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const solution = await Solution.findById(id);
    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    const userId = session.userId;
    const alreadyLiked = solution.likes.some(
      (likeId) => likeId.toString() === userId
    );

    if (alreadyLiked) {
      // Remove like
      await Solution.findByIdAndUpdate(id, {
        $pull: { likes: userId },
      });

      // Remove 1 point from solution author
      await User.updateOne(
        { _id: solution.authorId },
        { $inc: { points: -1 } }
      );

      const updated = await Solution.findById(id);

      return NextResponse.json({
        liked: false,
        likesCount: updated?.likes.length ?? 0,
      });
    } else {
      // Add like
      await Solution.findByIdAndUpdate(id, {
        $addToSet: { likes: userId },
      });

      // Award 1 point to solution author
      await User.updateOne(
        { _id: solution.authorId },
        { $inc: { points: 1 } }
      );

      const updated = await Solution.findById(id);

      return NextResponse.json({
        liked: true,
        likesCount: updated?.likes.length ?? 0,
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
