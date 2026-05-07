import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import Session from '@/models/Session';
import User from '@/models/User';
import type { SearchResultsDTO } from '@/types';

/**
 * GET /api/search
 * Query: q=<string>, type=exercises|sessions|profiles|all, limit=<number>
 * Returns: { exercises: [], sessions: [], profiles: [] }
 *
 * Exercises & Sessions use MongoDB $text search (text indexes defined on the models).
 * Users use regex prefix search on name + bio (no text index needed for small collection).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = (searchParams.get('q') ?? '').trim();
    const type = searchParams.get('type') ?? 'all';
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    if (!q || q.length < 1) {
      return NextResponse.json({ exercises: [], sessions: [], profiles: [] });
    }

    await connectToDatabase();

    const includeExercises = type === 'all' || type === 'exercises';
    const includeSessions = type === 'all' || type === 'sessions';
    const includeProfiles = type === 'all' || type === 'profiles';

    const results: SearchResultsDTO = {
      exercises: [],
      sessions: [],
      profiles: [],
    };

    const [exercises, sessions, users] = await Promise.all([
      includeExercises
        ? Exercise.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
          )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .populate('authorId', 'name avatar')
            .lean()
        : Promise.resolve([]),

      includeSessions
        ? Session.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
          )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .populate('teacherId', 'name avatar')
            .lean()
        : Promise.resolve([]),

      includeProfiles
        ? User.find({
            $or: [
              { name: { $regex: q, $options: 'i' } },
              { bio: { $regex: q, $options: 'i' } },
            ],
          })
            .select('_id name avatar role bio')
            .limit(limit)
            .lean()
        : Promise.resolve([]),
    ]);

    if (includeExercises) {
      results.exercises = (exercises as any[]).map((e) => ({
        _id: e._id.toString(),
        title: e.title,
        description: e.description,
        subject: e.subject,
        difficulty: e.difficulty,
        author: {
          _id: e.authorId?._id?.toString() ?? e.authorId?.toString() ?? '',
          name: e.authorId?.name ?? '',
          avatar: e.authorId?.avatar ?? null,
        },
        createdAt: e.createdAt?.toISOString() ?? '',
      }));
    }

    if (includeSessions) {
      results.sessions = (sessions as any[]).map((s) => ({
        _id: s._id.toString(),
        title: s.title,
        description: s.description,
        subject: s.subject,
        scheduledAt: s.scheduledAt?.toISOString() ?? '',
        status: s.status,
        teacher: {
          _id: s.teacherId?._id?.toString() ?? s.teacherId?.toString() ?? '',
          name: s.teacherId?.name ?? '',
          avatar: s.teacherId?.avatar ?? null,
        },
      }));
    }

    if (includeProfiles) {
      results.profiles = (users as any[]).map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        avatar: u.avatar ?? null,
        role: u.role,
        bio: u.bio ?? undefined,
      }));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[GET /api/search]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
