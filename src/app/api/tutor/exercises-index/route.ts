import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import { getSession } from '@/lib/auth';

/**
 * Light-payload index for the AI Tutor exercise picker.
 *
 * Returns the fields the picker UI needs to render each row + filter chips,
 * resolving the library/community split + the exam year via a single `$lookup`
 * onto `Exam`. Cap is intentionally low (100) — the picker filters
 * client-side and we don't want to ship the full catalog over the wire.
 *
 * Why not reuse `/api/exercises`? That route returns the full document (parts,
 * figures, attachments, populated author) and is shaped for the feed/library.
 * The tutor picker doesn't need any of that; this endpoint stays small and
 * fast and won't drift when the feed evolves.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const { searchParams } = request.nextUrl;
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '100', 10)));
    const source = searchParams.get('source'); // 'bac' | 'bac_blanc' | 'community' | null

    const match: Record<string, unknown> = {};
    if (source === 'community') match.examId = { $exists: false };
    else if (source === 'bac' || source === 'bac_blanc') match.examId = { $exists: true };

    const items = await Exercise.aggregate([
      { $match: match },
      { $sort: { lastActivityAt: -1, createdAt: -1 } },
      { $limit: limit * 2 }, // headroom for the post-lookup filter when source is bac/bac_blanc
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam',
          pipeline: [{ $project: { year: 1, examType: 1 } }],
        },
      },
      { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
      // When the caller asked for bac OR bac_blanc specifically, narrow on examType.
      ...(source === 'bac' || source === 'bac_blanc'
        ? [{ $match: { 'exam.examType': source } }]
        : []),
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          subject: 1,
          topic: 1,
          difficulty: 1,
          // Source kind: 'bac' / 'bac_blanc' (resolved from exam) or 'community'.
          source: {
            $cond: [
              { $ifNull: ['$examId', false] },
              { $ifNull: ['$exam.examType', 'bac'] },
              'community',
            ],
          },
          year: '$exam.year',
          // Tutor cards may want a thumbnail later — true if ANY question-context
          // figure has a cloudinary URL. Cheap to compute, optional in the UI.
          hasQuestionFigure: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$figures', []] },
                    as: 'fig',
                    cond: {
                      $and: [
                        { $eq: ['$$fig.context', 'question'] },
                        { $ne: ['$$fig.cloudinaryUrl', null] },
                        { $ne: ['$$fig.cloudinaryUrl', ''] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
    ]);

    // Normalize the response shape so client-side filtering is straightforward.
    const data = items.map((it) => ({
      _id: String(it._id),
      title: String(it.title ?? ''),
      subject: String(it.subject ?? ''),
      topic: typeof it.topic === 'string' ? it.topic : null,
      difficulty: (it.difficulty as 'easy' | 'medium' | 'hard' | undefined) ?? null,
      source: it.source as 'bac' | 'bac_blanc' | 'community',
      year: typeof it.year === 'number' ? it.year : null,
      hasQuestionFigure: Boolean(it.hasQuestionFigure),
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (err) {
    console.error('tutor/exercises-index error:', err);
    return NextResponse.json({ error: 'Failed to load exercises' }, { status: 500 });
  }
}
