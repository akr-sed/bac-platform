import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Notification from '@/models/Notification';

/**
 * POST /api/notifications/mark-read
 * Body: { ids?: string[] } — omit to mark all as read
 * Returns: { markedCount: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    const filter: Record<string, unknown> = {
      user: session.userId,
      read: false,
    };

    if (ids && ids.length > 0) {
      filter._id = { $in: ids };
    }

    const result = await Notification.updateMany(filter, { $set: { read: true } });

    return NextResponse.json({ markedCount: result.modifiedCount });
  } catch (error) {
    console.error('[POST /api/notifications/mark-read]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
