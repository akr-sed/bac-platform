import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';

/**
 * Admin content moderation endpoint.
 *
 * GET /api/admin/content?type=exercises|solutions|comments&page=1&limit=20
 *
 * Returns a paginated list of all content of the requested type, with
 * author populated, sorted newest first. Used by the moderation UI.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') ?? 'exercises';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    await connectToDatabase();

    if (type === 'exercises') {
      const [items, total] = await Promise.all([
        Exercise.find()
          .populate('authorId', 'name email role isVerifiedTeacher avatar')
          .select('title description difficulty subject createdAt likesCount commentsCount solutionCount')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Exercise.countDocuments(),
      ]);
      return NextResponse.json({
        data: items.map((i) => ({
          ...i,
          _id: String(i._id),
          author: i.authorId,
          authorId: undefined,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (type === 'solutions') {
      const [items, total] = await Promise.all([
        Solution.find()
          .populate('authorId', 'name email role isVerifiedTeacher avatar')
          .populate('exerciseId', 'title')
          .select('content createdAt likes')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Solution.countDocuments(),
      ]);
      return NextResponse.json({
        data: items.map((i) => ({
          _id: String(i._id),
          content: i.content,
          createdAt: i.createdAt,
          likesCount: Array.isArray(i.likes) ? i.likes.length : 0,
          author: i.authorId,
          exercise: i.exerciseId,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (type === 'comments') {
      const [items, total] = await Promise.all([
        Comment.find()
          .populate('authorId', 'name email role isVerifiedTeacher avatar')
          .populate('solutionId', '_id')
          .select('content createdAt')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Comment.countDocuments(),
      ]);
      return NextResponse.json({
        data: items.map((i) => ({
          _id: String(i._id),
          content: i.content,
          createdAt: i.createdAt,
          author: i.authorId,
          solutionId: i.solutionId ? String(i.solutionId._id ?? i.solutionId) : null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    console.error('[admin:content GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/content?type=...&id=...
 * Hard-deletes a piece of content as an admin moderation action.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    await connectToDatabase();

    let deleted: { _id: unknown } | null = null;
    if (type === 'exercises') {
      deleted = await Exercise.findByIdAndDelete(id).select('_id');
    } else if (type === 'solutions') {
      deleted = await Solution.findOneAndDelete({ _id: id }).select('_id');
    } else if (type === 'comments') {
      deleted = await Comment.findByIdAndDelete(id).select('_id');
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, _id: String(deleted._id) });
  } catch (err) {
    console.error('[admin:content DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
