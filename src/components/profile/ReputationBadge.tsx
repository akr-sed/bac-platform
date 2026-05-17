'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface ReputationBadgeProps {
  points: number;
}

function getBadgeLevel(points: number) {
  if (points >= 500) {
    return { key: 'expert' as const, color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  if (points >= 200) {
    return { key: 'advanced' as const, color: 'bg-purple-100 text-purple-800 border-purple-300' };
  }
  if (points >= 50) {
    return { key: 'intermediate' as const, color: 'bg-blue-100 text-blue-800 border-blue-300' };
  }
  return { key: 'beginner' as const, color: 'bg-slate-100 text-slate-800 border-slate-300' };
}

export default function ReputationBadge({ points }: ReputationBadgeProps) {
  const t = useTranslations('reputation.badges');
  const { key, color } = getBadgeLevel(points);

  return (
    <Badge variant="outline" className={color}>
      {t(key)}
    </Badge>
  );
}
