// src/app/api/collections/[id]/route.ts
//
// Wave C2 — Teacher curated collections (single-collection CRUD).
//
// GET    /api/collections/[id]  → fetch with populated exercises.
//                                 403 if private and viewer is not owner/admin.
// PUT    /api/collections/[id]  → update title/description/visibility. Owner or admin only.
// DELETE /api/collections/[id]  → owner or admin only.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Collection from '@/models/Collection';

const updateCollectionSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    visibility: z.enum(['public', 'private']).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

function serializeCollection(
  c: {
    _id: unknown;
    ownerId: unknown;
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    exerciseIds: unknown[];
    createdAt: Date;
    updatedAt: Date;
  },
  options: { populatedExercises?: boolean } = {}
) {
  return {
    _id: String(c._id),
    ownerId: c.ownerId,
    title: c.title,
    description: c.description ?? '',
    visibility: c.visibility,
    exerciseIds: options.populatedExercises
      ? c.exerciseIds
      : (c.exerciseIds ?? []).map((id) => String(id)),
    exerciseCount: (c.exerciseIds ?? []).length,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = await Collection.findById(id)
      .populate({
        path: 'ownerId',
        select: 'name avatar role isVerifiedTeacher points',
      })
      .populate({
        path: 'exerciseIds',
        populate: {
          path: 'authorId',
          select: 'name avatar role isVerifiedTeacher points',
        },
      })
      .lean();

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const auth = await getSession();
    const ownerIdStr = String(
      (collection.ownerId as { _id?: unknown })?._id ?? collection.ownerId
    );
    const isOwner = Boolean(auth && auth.userId === ownerIdStr);
    const isAdmin = auth?.role === 'admin';

    if (collection.visibility === 'private' && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      ...serializeCollection(
        collection as unknown as Parameters<typeof serializeCollection>[0],
        { populatedExercises: true }
      ),
      isOwner,
    });
  } catch (err) {
    console.error('[collections:GET/:id]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const isOwner = String(collection.ownerId) === auth.userId;
    if (!isOwner && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateCollectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    if (result.data.title !== undefined) collection.title = result.data.title;
    if (result.data.description !== undefined) {
      collection.description = result.data.description;
    }
    if (result.data.visibility !== undefined) {
      collection.visibility = result.data.visibility;
    }
    await collection.save();

    return NextResponse.json(
      serializeCollection(
        collection.toObject() as unknown as Parameters<
          typeof serializeCollection
        >[0]
      )
    );
  } catch (err) {
    console.error('[collections:PUT]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const auth = await getSession();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const isOwner = String(collection.ownerId) === auth.userId;
    if (!isOwner && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await collection.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[collections:DELETE]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
