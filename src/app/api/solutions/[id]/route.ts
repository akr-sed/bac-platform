import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { destroyManyByUrl } from '@/lib/cloudinary';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/solutions/:id  — toggle teacher-only flags on a solution.
 *
 * Currently supported body fields:
 *   { isOfficial: boolean }
 *
 * Guard rails:
 *  - Only the solution's author can toggle their own flag.
 *  - The author's current role must be 'teacher' or 'admin'.
 *  - Admins can also toggle any solution (matches DELETE behaviour above).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const { isOfficial } = body as { isOfficial?: boolean };

    if (typeof isOfficial !== 'boolean') {
      return NextResponse.json(
        { error: 'No supported field to update' },
        { status: 400 }
      );
    }

    const solution = await Solution.findById(id);
    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    const isAuthor = solution.authorId.toString() === session.userId;
    const isAdmin = session.role === 'admin';
    const isTeacher = session.role === 'teacher';

    if (!(isAdmin || (isAuthor && isTeacher))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    solution.isOfficial = isOfficial;
    await solution.save();

    return NextResponse.json({
      ok: true,
      _id: String(solution._id),
      isOfficial: solution.isOfficial,
    });
  } catch (err) {
    console.error('[solution PATCH]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    if (
      solution.authorId.toString() !== session.userId &&
      session.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const mediaUrls = solution.images ?? [];

    // Cascade: delete the Solution first so the post-delete hook can count
    // existing comments and decrement Exercise.commentsCount correctly.
    // Only then do we actually purge the comments.
    await Solution.findByIdAndDelete(id);
    await Comment.deleteMany({ solutionId: id });

    // Best-effort Cloudinary cleanup after DB delete succeeds.
    await destroyManyByUrl(mediaUrls);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
