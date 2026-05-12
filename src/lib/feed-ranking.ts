// src/lib/feed-ranking.ts
import type { PipelineStage } from 'mongoose';

export type FeedSort = 'for-you' | 'trending' | 'latest';

export const FEED_SORTS = ['for-you', 'trending', 'latest'] as const;

/**
 * Coerce an arbitrary query-string value to a valid FeedSort.
 * Falls back to "for-you" when the input is missing or unknown.
 */
export function parseFeedSort(value: string | null | undefined): FeedSort {
  if (value === 'trending' || value === 'latest' || value === 'for-you') {
    return value;
  }
  return 'for-you';
}

interface BuildFeedPipelineArgs {
  preferredSubjects: string[];
  page: number;
  limit: number;
  sort?: FeedSort;
}

const AUTHOR_LOOKUP: PipelineStage[] = [
  {
    $lookup: {
      from: 'users',
      localField: 'authorId',
      foreignField: '_id',
      as: 'author',
      pipeline: [{ $project: { name: 1, avatar: 1, role: 1, isVerifiedTeacher: 1, points: 1 } }],
    },
  },
  { $unwind: '$author' },
];

const PROJECT_FIELDS: PipelineStage = {
  $project: {
    title: 1, description: 1, difficulty: 1,
    subject: 1, topic: 1, subtopic: 1,
    attachments: 1,
    likesCount: 1, solutionCount: 1, commentsCount: 1,
    createdAt: 1, updatedAt: 1, lastActivityAt: 1,
    author: 1,
    _score: 1,
  },
};

/**
 * "For You" ranking — engagement score with subject-preference boost and
 * recency decay on lastActivityAt (half-life ≈ 3 days).
 */
function forYouStages(preferredSubjects: string[]): PipelineStage[] {
  return [
    {
      $addFields: {
        _decay: {
          $exp: {
            $multiply: [
              -0.231, // ln(2) / 3 → half-life 3 days
              {
                $divide: [
                  { $subtract: ['$$NOW', '$lastActivityAt'] },
                  86400000,
                ],
              },
            ],
          },
        },
        _preferenceBoost: {
          $cond: [
            { $in: ['$subject', preferredSubjects] },
            50,
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        _score: {
          $add: [
            {
              $multiply: [
                {
                  $add: [
                    { $multiply: ['$likesCount', 2] },
                    { $multiply: ['$commentsCount', 3] },
                    '$solutionCount',
                  ],
                },
                '$_decay',
              ],
            },
            '$_preferenceBoost',
          ],
        },
      },
    },
    { $sort: { _score: -1, lastActivityAt: -1 } },
  ];
}

/**
 * "Trending" ranking — weighted engagement score with a 48h half-life
 * applied to createdAt. Recent items with strong engagement bubble up;
 * older content drops off quickly.
 *
 *   engagement = (likesCount * 3) + (solutionCount * 2) + (commentsCount * 1)
 *   decay      = exp(-hoursOld * ln(2) / 48)   // 48h half-life
 *   score      = engagement * decay
 */
function trendingStages(): PipelineStage[] {
  return [
    {
      $addFields: {
        _engagement: {
          $add: [
            { $multiply: ['$likesCount', 3] },
            { $multiply: ['$solutionCount', 2] },
            '$commentsCount',
          ],
        },
        _ageHours: {
          $divide: [
            { $subtract: ['$$NOW', '$createdAt'] },
            3600000,
          ],
        },
      },
    },
    {
      $addFields: {
        _decay: {
          $exp: {
            // ln(2)/48 ≈ 0.014438 → 48h half-life
            $multiply: [-0.014438, '$_ageHours'],
          },
        },
      },
    },
    {
      $addFields: {
        _score: { $multiply: ['$_engagement', '$_decay'] },
      },
    },
    { $sort: { _score: -1, createdAt: -1 } },
  ];
}

/**
 * "Latest" ranking — strict reverse-chronological by createdAt.
 */
function latestStages(): PipelineStage[] {
  return [{ $sort: { createdAt: -1 } }];
}

export function buildFeedPipeline({
  preferredSubjects,
  page,
  limit,
  sort = 'for-you',
}: BuildFeedPipelineArgs): PipelineStage[] {
  let rankingStages: PipelineStage[];
  if (sort === 'trending') {
    rankingStages = trendingStages();
  } else if (sort === 'latest') {
    rankingStages = latestStages();
  } else {
    rankingStages = forYouStages(preferredSubjects);
  }

  return [
    ...rankingStages,
    { $skip: page * limit },
    { $limit: limit },
    ...AUTHOR_LOOKUP,
    PROJECT_FIELDS,
  ];
}
