import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';

type RouteContext = { params: Promise<{ id: string }> };

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

    // Cascade: delete all comments on this solution, then the solution
    await Comment.deleteMany({ solutionId: id });
    await Solution.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
