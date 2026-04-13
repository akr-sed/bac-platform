import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Category from '@/models/Category';

const createCategorySchema = z.object({
  name: z.object({
    en: z.string().min(1),
    fr: z.string().min(1),
    ar: z.string().min(1),
  }),
  type: z.enum(['subject', 'topic', 'subtopic']),
  parentId: z.string().nullable().optional(),
  order: z.number().optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');

    const filter: Record<string, unknown> = {};

    if (type && ['subject', 'topic', 'subtopic'].includes(type)) {
      filter.type = type;
    }
    if (parentId) {
      filter.parentId = parentId;
    }

    // If no filters, return a tree structure
    if (!type && !parentId) {
      const allCategories = await Category.find().sort({ order: 1, createdAt: 1 }).lean();

      const categoryMap = new Map<string, Record<string, unknown>>();
      const subjects: Record<string, unknown>[] = [];

      // Build map of all categories
      for (const cat of allCategories) {
        categoryMap.set(cat._id.toString(), {
          _id: cat._id.toString(),
          name: cat.name,
          type: cat.type,
          parentId: cat.parentId ? cat.parentId.toString() : null,
          order: cat.order,
          children: [],
        });
      }

      // Build tree
      for (const cat of allCategories) {
        const node = categoryMap.get(cat._id.toString())!;
        if (cat.parentId) {
          const parent = categoryMap.get(cat.parentId.toString());
          if (parent) {
            (parent.children as Record<string, unknown>[]).push(node);
          }
        } else {
          subjects.push(node);
        }
      }

      return NextResponse.json({ data: subjects });
    }

    const categories = await Category.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const data = categories.map((cat) => ({
      _id: cat._id.toString(),
      name: cat.name,
      type: cat.type,
      parentId: cat.parentId ? cat.parentId.toString() : null,
      order: cat.order,
    }));

    return NextResponse.json({ data });
  } catch {
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
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, type, parentId, order } = result.data;

    // Validate parentId requirements
    if (type === 'subject' && parentId) {
      return NextResponse.json(
        { error: 'Subjects cannot have a parent' },
        { status: 400 }
      );
    }

    if ((type === 'topic' || type === 'subtopic') && !parentId) {
      return NextResponse.json(
        { error: `${type} must have a parentId` },
        { status: 400 }
      );
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
    }

    const category = await Category.create({
      name,
      type,
      parentId: parentId || null,
      order,
    });

    return NextResponse.json(
      {
        _id: category._id.toString(),
        name: category.name,
        type: category.type,
        parentId: category.parentId ? category.parentId.toString() : null,
        order: category.order,
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
