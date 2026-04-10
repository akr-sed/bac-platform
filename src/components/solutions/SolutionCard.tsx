'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LikeButton from './LikeButton';
import CommentList from '@/components/comments/CommentList';
import type { SolutionDTO } from '@/types';

interface SolutionCardProps {
  solution: SolutionDTO;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function SolutionCard({ solution }: SolutionCardProps) {
  const t = useTranslations('solutions');
  const [showComments, setShowComments] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
              {solution.author?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {solution.author?.name || 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">
                {timeAgo(solution.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="whitespace-pre-wrap text-sm text-slate-700">
          {solution.content}
        </div>

        {solution.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {solution.images.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={url}
                  alt={`Solution image ${i + 1}`}
                  className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                />
              </a>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <LikeButton
            solutionId={solution._id}
            initialLikes={solution.likes}
            initialLikesCount={solution.likesCount}
          />
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
            <span>
              {t('comments', { count: solution.commentCount })}
            </span>
          </button>
        </div>

        {showComments && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <CommentList solutionId={solution._id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
