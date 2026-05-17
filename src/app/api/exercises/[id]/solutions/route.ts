import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { grantXp } from '@/lib/gamification';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';

const createSolutionSchema = z.object({
  content: z.string().min(1),
  images: z.array(z.string()).optional().default([]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const filter = { exerciseId: id };

    const [solutions, total] = await Promise.all([
      Solution.find(filter)
        .populate({
          path: 'authorId',
          select: 'name email role points isVerifiedTeacher avatar createdAt',
        })
        // Official solutions always sort first; ties break by createdAt desc.
        .sort({ isOfficial: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Solution.countDocuments(filter),
    ]);

    const solutionIds = solutions.map((s) => s._id);
    const commentCounts = await Comment.aggregate([
      { $match: { solutionId: { $in: solutionIds } } },
      { $group: { _id: '$solutionId', count: { $sum: 1 } } },
    ]);

    const commentCountMap = new Map(
      commentCounts.map((c) => [c._id.toString(), c.count])
    );

    const data = solutions.map((solution) => ({
      _id: solution._id.toString(),
      exerciseId: solution.exerciseId.toString(),
      author: solution.authorId,
      content: solution.content,
      images: solution.images,
      likes: solution.likes.map((l: { toString: () => string }) => l.toString()),
      likesCount: solution.likes.length,
      commentCount: commentCountMap.get(solution._id.toString()) || 0,
      isOfficial: !!solution.isOfficial,
      createdAt: solution.createdAt,
      updatedAt: solution.updatedAt,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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
    const result = createSolutionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const solution = await Solution.create({
      exerciseId: id,
      authorId: session.userId,
      content: result.data.content,
      images: result.data.images,
      likes: [],
    });

    // Award XP to the author. grantXp also keeps the legacy `points` field
    // in sync and writes an XPLedger entry for audit.
    await grantXp(session.userId, 5, 'solution-submitted', {
      exerciseId: id,
      solutionId: solution._id.toString(),
    });

    const populated = await Solution.findById(solution._id)
      .populate({
        path: 'authorId',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .lean();

    if (!populated) {
      return NextResponse.json(
        { error: 'Failed to create solution' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        _id: populated._id.toString(),
        exerciseId: populated.exerciseId.toString(),
        author: populated.authorId,
        content: populated.content,
        images: populated.images,
        likes: [],
        likesCount: 0,
        commentCount: 0,
        isOfficial: !!populated.isOfficial,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
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
