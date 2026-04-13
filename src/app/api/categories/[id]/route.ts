import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Category from '@/models/Category';

const updateCategorySchema = z.object({
  name: z.object({
    en: z.string().min(1),
    fr: z.string().min(1),
    ar: z.string().min(1),
  }).optional(),
  type: z.enum(['subject', 'topic', 'subtopic']).optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
});

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
    const result = updateCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndUpdate(id, result.data, {
      new: true,
    }).lean();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: category._id.toString(),
      name: category.name,
      type: category.type,
      parentId: category.parentId ? category.parentId.toString() : null,
      order: category.order,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Cascade delete: find all children recursively
    const idsToDelete: string[] = [id];
    const queue: string[] = [id];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = await Category.find({ parentId }).select('_id').lean();
      for (const child of children) {
        const childId = child._id.toString();
        idsToDelete.push(childId);
        queue.push(childId);
      }
    }

    await Category.deleteMany({ _id: { $in: idsToDelete } });

    return NextResponse.json({ success: true, deletedCount: idsToDelete.length });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
