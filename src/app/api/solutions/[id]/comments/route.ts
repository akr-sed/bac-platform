import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { grantXp } from '@/lib/gamification';
import Comment from '@/models/Comment';

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  kind: z.enum(['comment', 'tip', 'mistake']).optional().default('comment'),
});

type RouteContext = { params: Promise<{ id: string }> };

// Normalise a populated author subdocument so it matches the client `Comment`
// interface exactly: `_id` as string, only the fields the UI renders.
function serializeAuthor(author: unknown) {
  if (!author || typeof author !== 'object') return null;
  const a = author as Record<string, unknown> & { _id?: { toString(): string } };
  if (!a._id) return null;
  return {
    _id: a._id.toString(),
    name: typeof a.name === 'string' ? a.name : '',
    avatar: typeof a.avatar === 'string' ? a.avatar : null,
    points: typeof a.points === 'number' ? a.points : 0,
    role: typeof a.role === 'string' ? a.role : 'student',
    isVerifiedTeacher: Boolean(a.isVerifiedTeacher),
  };
}

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
      author: serializeAuthor(comment.authorId),
      content: comment.content,
      kind: comment.kind ?? 'comment',
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
      kind: result.data.kind,
    });

    await grantXp(session.userId, 2, 'comment-posted', {
      solutionId: id,
      commentId: comment._id.toString(),
    });

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
        author: serializeAuthor(populated.authorId),
        content: populated.content,
        kind: populated.kind ?? 'comment',
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
