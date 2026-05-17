import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Report from '@/models/Report';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (!body.status || !['resolved', 'dismissed'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "resolved" or "dismissed".' },
        { status: 400 }
      );
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    )
      .populate({
        path: 'reportedBy',
        select: 'name email role points isVerifiedTeacher avatar createdAt',
      })
      .lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: report._id.toString(),
      reportedBy: report.reportedBy,
      targetType: report.targetType,
      targetId: report.targetId.toString(),
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
