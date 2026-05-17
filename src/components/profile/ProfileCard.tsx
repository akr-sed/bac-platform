'use client';

import { useTranslations } from 'next-intl';
import type { UserDTO } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ReputationBadge from './ReputationBadge';

interface ProfileCardProps {
  user: UserDTO;
  exerciseCount: number;
  solutionCount: number;
}

export default function ProfileCard({
  user,
  exerciseCount,
  solutionCount,
}: ProfileCardProps) {
  const t = useTranslations('profile');
  const roles = useTranslations('roles');

  const initial = user.name.charAt(0).toUpperCase();
  const joinedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-16">
            <AvatarFallback className="text-lg font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{roles(user.role)}</Badge>
              {user.isVerifiedTeacher && (
                <Badge variant="default" className="bg-green-600 text-white">
                  {t('verifiedTeacher')}
                </Badge>
              )}
              <ReputationBadge points={user.points} />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t('points')}
            </p>
            <p className="mt-1 text-2xl font-bold">{user.points}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t('exercises')}
            </p>
            <p className="mt-1 text-2xl font-bold">{exerciseCount}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t('solutions')}
            </p>
            <p className="mt-1 text-2xl font-bold">{solutionCount}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t('joinedAt')}
            </p>
            <p className="mt-1 text-sm font-semibold">{joinedDate}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('role')}:</span>
          <span className="font-medium text-foreground">{roles(user.role)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
