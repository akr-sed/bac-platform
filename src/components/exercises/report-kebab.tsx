'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { ReportActionMenu } from '@/components/ui/report-action-menu';

type ReportTargetType = 'exercise' | 'solution' | 'comment' | 'user';

interface ReportKebabProps {
  targetType: ReportTargetType;
  targetId: string;
  /**
   * Author of the target. When the viewer is the author, the kebab is
   * hidden. When the viewer is unauthenticated, the kebab is hidden too.
   */
  authorId: string | null | undefined;
  className?: string;
}

/**
 * Client-only wrapper around ReportActionMenu that hides itself when the
 * viewer is the author or is logged out. Kept tiny so server components
 * (e.g. ExerciseCard) can stay server-rendered.
 */
export function ReportKebab({
  targetType,
  targetId,
  authorId,
  className,
}: ReportKebabProps) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return null;
  if (authorId && user._id === authorId) return null;

  return (
    <ReportActionMenu
      targetType={targetType}
      targetId={targetId}
      className={className}
    />
  );
}
