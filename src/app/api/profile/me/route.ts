import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import { getSession, clearAuthCookie } from '@/lib/auth';

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
    const { name, avatar, bio, email, currentPassword, newPassword, preferences, onboardedAt, notificationPrefs, privacyPrefs } = body;

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update name
    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    // Update bio
    if (bio !== undefined && typeof bio === 'string') {
      user.bio = bio.trim() || undefined;
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

    // Update preferences (feed personalization + onboarding)
    if (preferences && typeof preferences === 'object') {
      const cleanedSubjects = Array.isArray(preferences.subjects)
        ? preferences.subjects
            .filter((s: unknown): s is string => typeof s === 'string')
            .slice(0, 10)
        : user.preferences?.subjects ?? [];
      user.preferences = {
        subjects: cleanedSubjects,
        stream: typeof preferences.stream === 'string' ? preferences.stream : user.preferences?.stream,
        year: typeof preferences.year === 'string' ? preferences.year : user.preferences?.year,
        interests: Array.isArray(preferences.interests)
          ? preferences.interests.filter((s: unknown): s is string => typeof s === 'string').slice(0, 20)
          : user.preferences?.interests ?? [],
      };
    }

    // Update onboardedAt
    if (onboardedAt && !user.onboardedAt) {
      user.onboardedAt = new Date(onboardedAt);
    }

    // Update notification preferences
    if (notificationPrefs && typeof notificationPrefs === 'object') {
      user.notificationPrefs = {
        likes: notificationPrefs.likes !== false,
        comments: notificationPrefs.comments !== false,
        mentions: notificationPrefs.mentions !== false,
        weeklyDigest: notificationPrefs.weeklyDigest !== false,
        marketing: notificationPrefs.marketing === true,
      };
    }

    // Update privacy preferences
    if (privacyPrefs && typeof privacyPrefs === 'object') {
      user.privacyPrefs = {
        profilePublic: privacyPrefs.profilePublic !== false,
        searchIndexing: privacyPrefs.searchIndexing !== false,
      };
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
        bio: user.bio ?? null,
        preferences: user.preferences ?? { subjects: [] },
        notificationPrefs: user.notificationPrefs ?? null,
        privacyPrefs: user.privacyPrefs ?? null,
        onboardedAt: user.onboardedAt ?? null,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error, please try again' }, { status: 500 });
  }
}

// PATCH is an alias for PUT — same handler
export { PUT as PATCH };

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the user.
    // NOTE: Content (exercises, solutions, comments) is intentionally left in place
    // with the authorId still referencing the deleted user's ID. A Wave 5 cascade
    // script should handle orphaned content cleanup.
    await User.findByIdAndDelete(session.userId);

    const response = NextResponse.json({ ok: true });
    // Clear auth cookie
    clearAuthCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: 'Server error, please try again' }, { status: 500 });
  }
}
