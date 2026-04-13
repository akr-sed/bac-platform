import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Report from '@/models/Report';

const createReportSchema = z.object({
  targetType: z.enum(['exercise', 'solution', 'comment', 'user']),
  targetId: z.string().min(1),
  reason: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const report = await Report.create({
      reportedBy: session.userId,
      targetType: result.data.targetType,
      targetId: result.data.targetId,
      reason: result.data.reason,
    });

    return NextResponse.json(
      {
        _id: report._id.toString(),
        targetType: report.targetType,
        targetId: report.targetId.toString(),
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
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
