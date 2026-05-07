import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import User from '@/models/User';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    if (id === session.userId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : undefined;

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason,
      },
      { new: true }
    ).select('_id name isBlocked blockedAt blockedReason');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: String(user._id),
      isBlocked: user.isBlocked,
      blockedAt: user.blockedAt,
      blockedReason: user.blockedReason,
    });
  } catch (err) {
    console.error('[admin:users:block POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
        $unset: { blockedAt: '', blockedReason: '' },
      },
      { new: true }
    ).select('_id isBlocked');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ _id: String(user._id), isBlocked: false });
  } catch (err) {
    console.error('[admin:users:block DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
