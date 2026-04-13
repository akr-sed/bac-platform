import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Report from '@/models/Report';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};

    if (status && ['pending', 'resolved', 'dismissed'].includes(status)) {
      filter.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate({
          path: 'reportedBy',
          select: 'name email role points isVerifiedTeacher avatar createdAt',
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const data = reports.map((report) => ({
      _id: report._id.toString(),
      reportedBy: report.reportedBy,
      targetType: report.targetType,
      targetId: report.targetId.toString(),
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
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
