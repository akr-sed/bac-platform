import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const [user, exercises, solutions] = await Promise.all([
      User.findById(session.userId).select('-passwordHash -resetToken -resetTokenExpiry').lean(),
      Exercise.find({ authorId: session.userId })
        .select('title difficulty createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Solution.find({ authorId: session.userId })
        .select('exerciseId content createdAt')
        .populate({ path: 'exerciseId', select: 'title' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        isVerifiedTeacher: user.isVerifiedTeacher,
        avatar: user.avatar ?? null,
        preferences: user.preferences ?? { subjects: [] },
        createdAt: user.createdAt,
      },
      exercises: exercises.map((ex) => ({
        _id: ex._id.toString(),
        title: ex.title,
        difficulty: ex.difficulty,
        createdAt: ex.createdAt,
      })),
      solutions: solutions.map((sol) => {
        const exerciseDoc = sol.exerciseId as unknown as { _id: unknown; title?: string } | null;
        return {
          _id: sol._id.toString(),
          exerciseId: exerciseDoc?._id?.toString() ?? null,
          exerciseTitle: exerciseDoc?.title ?? 'Unknown exercise',
          createdAt: sol.createdAt,
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Server error, please try again' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { name, avatar, email, currentPassword, newPassword, preferences } = body;

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update name
    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    // Update avatar
    if (avatar !== undefined) {
      user.avatar = avatar || undefined;
    }

    // Update email
    if (email && typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return NextResponse.json({ error: 'Email already taken' }, { status: 400 });
        }
        user.email = normalizedEmail;
      }
    }

    // Update password
    if (newPassword && typeof newPassword === 'string') {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Update preferences.subjects (feed personalization)
    if (preferences?.subjects && Array.isArray(preferences.subjects)) {
      const cleaned = preferences.subjects
        .filter((s: unknown): s is string => typeof s === 'string')
        .slice(0, 10);
      user.preferences = { subjects: cleaned };
    }

    await user.save();

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        isVerifiedTeacher: user.isVerifiedTeacher,
        avatar: user.avatar ?? null,
        preferences: user.preferences ?? { subjects: [] },
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error, please try again' }, { status: 500 });
  }
}
