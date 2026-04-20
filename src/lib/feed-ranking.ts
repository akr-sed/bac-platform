// src/lib/feed-ranking.ts
import type { PipelineStage } from 'mongoose';

interface BuildFeedPipelineArgs {
  preferredSubjects: string[];
  page: number;
  limit: number;
}

export function buildFeedPipeline({
  preferredSubjects,
  page,
  limit,
}: BuildFeedPipelineArgs): PipelineStage[] {
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
    { $skip: page * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'author',
        pipeline: [{ $project: { name: 1, avatar: 1, role: 1, isVerifiedTeacher: 1 } }],
      },
    },
    { $unwind: '$author' },
    {
      $project: {
        title: 1, description: 1, difficulty: 1,
        subject: 1, topic: 1, subtopic: 1,
        attachments: 1,
        likesCount: 1, solutionCount: 1, commentsCount: 1,
        createdAt: 1, updatedAt: 1, lastActivityAt: 1,
        author: 1,
        _score: 1,
      },
    },
  ];
}
