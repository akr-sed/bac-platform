// src/app/api/collections/[id]/exercises/route.ts
//
// Wave C2 — Add/remove exercises from a collection (owner-only).
//
// POST   /api/collections/[id]/exercises  body { exerciseId } → $addToSet
// DELETE /api/collections/[id]/exercises  body { exerciseId } → $pull
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Collection from '@/models/Collection';
import Exercise from '@/models/Exercise';

const exerciseBodySchema = z.object({
  exerciseId: z.string().min(1),
});

type RouteContext = { params: Promise<{ id: string }> };

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

async function authoriseOwner(collectionId: string) {
  const auth = await getSession();
  if (!auth) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const;
  }
  if (!isValidObjectId(collectionId)) {
    return {
      error: NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      ),
    } as const;
  }
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    return {
      error: NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      ),
    } as const;
  }
  // Spec: "Owner only" for both POST and DELETE. Admins are intentionally not
  // granted curation rights here — they manage collections via PUT/DELETE on
  // the parent route.
  if (String(collection.ownerId) !== auth.userId) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    } as const;
  }
  return { collection } as const;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const guard = await authoriseOwner(id);
    if ('error' in guard) return guard.error;

    const body = await request.json();
    const parsed = exerciseBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    if (!isValidObjectId(parsed.data.exerciseId)) {
      return NextResponse.json(
        { error: 'Invalid exerciseId' },
        { status: 400 }
      );
    }

    const exists = await Exercise.findById(parsed.data.exerciseId).select(
      '_id'
    );
    if (!exists) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    await Collection.updateOne(
      { _id: guard.collection._id },
      {
        $addToSet: {
          exerciseIds: new Types.ObjectId(parsed.data.exerciseId),
        },
      }
    );

    const updated = await Collection.findById(guard.collection._id).lean();
    return NextResponse.json(
      {
        _id: String(updated!._id),
        exerciseIds: (updated!.exerciseIds ?? []).map((eid) => String(eid)),
        exerciseCount: (updated!.exerciseIds ?? []).length,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[collections/exercises:POST]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const guard = await authoriseOwner(id);
    if ('error' in guard) return guard.error;

    const body = await request.json();
    const parsed = exerciseBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    if (!isValidObjectId(parsed.data.exerciseId)) {
      return NextResponse.json(
        { error: 'Invalid exerciseId' },
        { status: 400 }
      );
    }

    await Collection.updateOne(
      { _id: guard.collection._id },
      {
        $pull: {
          exerciseIds: new Types.ObjectId(parsed.data.exerciseId),
        },
      }
    );

    const updated = await Collection.findById(guard.collection._id).lean();
    return NextResponse.json({
      _id: String(updated!._id),
      exerciseIds: (updated!.exerciseIds ?? []).map((eid) => String(eid)),
      exerciseCount: (updated!.exerciseIds ?? []).length,
    });
  } catch (err) {
    console.error('[collections/exercises:DELETE]', err);
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
