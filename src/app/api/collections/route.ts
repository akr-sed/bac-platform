// src/app/api/collections/route.ts
//
// Wave C2 — Teacher curated collections (list + create).
//
// GET  /api/collections
//   • Auth optional.
//   • ?owner=<userId> filters by owner. When the viewer is that owner (or an
//     admin) we return public + private; otherwise only public collections
//     are exposed. Without ?owner we return all public collections.
//   • ?visibility=public can be passed without auth and narrows results.
//
// POST /api/collections
//   • Teacher- or admin-only. Creates an empty collection with title,
//     optional description, and visibility (defaults to 'public').
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Collection from '@/models/Collection';

const createCollectionSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  visibility: z.enum(['public', 'private']).optional().default('public'),
});

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    const { searchParams } = request.nextUrl;
    const ownerParam = searchParams.get('owner');
    const visibilityParam = searchParams.get('visibility');

    const filter: Record<string, unknown> = {};

    if (ownerParam) {
      if (!isValidObjectId(ownerParam)) {
        return NextResponse.json({ error: 'Invalid owner id' }, { status: 400 });
      }
      filter.ownerId = new Types.ObjectId(ownerParam);
    }

    // Visibility gating: viewer is the owner OR admin → see public + private.
    // Otherwise only public is exposed. An explicit ?visibility=public always
    // narrows to public regardless.
    const viewerIsOwner =
      session && ownerParam && session.userId === ownerParam;
    const viewerIsAdmin = session?.role === 'admin';
    const canSeePrivate = Boolean(viewerIsOwner || viewerIsAdmin);

    if (visibilityParam === 'public') {
      filter.visibility = 'public';
    } else if (visibilityParam === 'private') {
      if (!canSeePrivate) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      filter.visibility = 'private';
    } else if (!canSeePrivate) {
      filter.visibility = 'public';
    }

    const collections = await Collection.find(filter)
      .sort({ updatedAt: -1 })
      .populate({
        path: 'ownerId',
        select: 'name avatar role isVerifiedTeacher points',
      })
      .lean();

    const data = collections.map((c) => ({
      _id: String(c._id),
      ownerId: c.ownerId,
      title: c.title,
      description: c.description ?? '',
      visibility: c.visibility,
      exerciseIds: (c.exerciseIds ?? []).map((id) => String(id)),
      exerciseCount: (c.exerciseIds ?? []).length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[collections:GET]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'teacher' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers can create collections' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createCollectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const created = await Collection.create({
      ownerId: new Types.ObjectId(session.userId),
      title: result.data.title,
      description: result.data.description,
      visibility: result.data.visibility,
      exerciseIds: [],
    });

    return NextResponse.json(
      {
        _id: String(created._id),
        ownerId: String(created.ownerId),
        title: created.title,
        description: created.description ?? '',
        visibility: created.visibility,
        exerciseIds: [],
        exerciseCount: 0,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[collections:POST]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
