import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Notification from '@/models/Notification';
import type { NotificationDTO } from '@/types';

/**
 * GET /api/notifications
 * Query params: cursor?, limit? (default 20), type? (like|comment|mention|reply|follow), unread? (1)
 * Returns: { notifications: NotificationDTO[], nextCursor: string | null, unreadCount: number }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === '1';

    const filter: Record<string, unknown> = { user: session.userId };
    if (type && ['like', 'comment', 'mention', 'reply', 'follow'].includes(type)) {
      filter.type = type;
    }
    if (unreadOnly) {
      filter.read = false;
    }
    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('actor', 'name avatar')
      .lean();

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    const nextCursor =
      hasMore && notifications.length > 0
        ? (notifications[notifications.length - 1] as { createdAt: Date }).createdAt.toISOString()
        : null;

    const unreadCount = await Notification.countDocuments({
      user: session.userId,
      read: false,
    });

    const dtos: NotificationDTO[] = notifications.map((n: any) => ({
      _id: n._id.toString(),
      user: n.user.toString(),
      actor: {
        _id: n.actor._id?.toString() ?? n.actor.toString(),
        name: n.actor.name ?? '',
        avatar: n.actor.avatar ?? null,
      },
      type: n.type,
      targetType: n.targetType,
      targetId: n.targetId.toString(),
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    return NextResponse.json({ notifications: dtos, nextCursor, unreadCount });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
