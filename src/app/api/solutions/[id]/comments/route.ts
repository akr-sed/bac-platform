import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Comment from '@/models/Comment';
import User from '@/models/User';

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    const comments = await Comment.find({ solutionId: id })
      .populate({
        path: 'authorId',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .sort({ createdAt: 1 })
      .lean();

    const data = comments.map((comment) => ({
      _id: comment._id.toString(),
      solutionId: comment.solutionId.toString(),
      author: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
    }));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const body = await request.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const comment = await Comment.create({
      solutionId: id,
      authorId: session.userId,
      content: result.data.content,
    });

    await User.updateOne(
      { _id: session.userId },
      { $inc: { points: 2 } }
    );

    const populated = await Comment.findById(comment._id)
      .populate({
        path: 'authorId',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .lean();

    if (!populated) {
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        _id: populated._id.toString(),
        solutionId: populated.solutionId.toString(),
        author: populated.authorId,
        content: populated.content,
        createdAt: populated.createdAt,
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
