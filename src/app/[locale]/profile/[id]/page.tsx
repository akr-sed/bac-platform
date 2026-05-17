'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { User, Calendar, BookOpen, MessageCircle, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Logo } from '@/components/brand/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsPill } from '@/components/ui/points-pill';
import { RoleBadge } from '@/components/ui/role-badge';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { Badge } from '@/components/ui/badge';
import { FollowButton } from '@/components/profile/FollowButton';
import { useAuth } from '@/components/providers/AuthProvider';

interface PublicProfile {
  _id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  isVerifiedTeacher?: boolean;
  points: number;
  avatar?: string | null;
  /** Optional — falls back to a points-derived tier when the API omits it. */
  badge?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  createdAt: string;
  exercises?: Array<{
    _id: string;
    title: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    createdAt?: string;
  }>;
  solutions?: Array<{
    _id: string;
    exerciseTitle?: string;
    createdAt?: string;
  }>;
}

interface ProfileResponse {
  user: PublicProfile;
  followersCount?: number;
  followingCount?: number;
}

export default function PublicProfilePage() {
  const t = useTranslations('profile');
  const roles = useTranslations('roles');
  const reputation = useTranslations('reputation.badges');
  const params = useParams();
  const id = params.id as string;
  const { user: viewer } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = (await res.json()) as ProfileResponse & PublicProfile;
        // The existing API returns `{ user, ...counts }` but historically the
        // page also reads top-level fields. Support both shapes so we don't
        // regress whatever the upstream actually serves.
        const profileData = (json.user ?? json) as PublicProfile;
        setProfile(profileData);
        setFollowersCount(json.followersCount ?? 0);
        setFollowingCount(json.followingCount ?? 0);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  const isSelf = Boolean(viewer && profile && viewer._id === profile._id);

  // The User model has no `badge` field — derive it from `points` the same
  // way <ReputationBadge> does. Without this fallback, the API returns
  // `badge: undefined` and `reputation(undefined)` crashes next-intl with
  // "Cannot read properties of undefined (reading 'split')".
  function deriveBadge(points: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (points >= 500) return 'expert';
    if (points >= 200) return 'advanced';
    if (points >= 50) return 'intermediate';
    return 'beginner';
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <User className="mb-4 size-16 text-muted-foreground/40" />
        <p className="text-lg font-medium text-foreground">Profile not found</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile header — navy band per spec §5 */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-[#003449] text-white">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:items-start sm:text-start sm:gap-5">
            <UserAvatar src={profile.avatar} name={profile.name} px={64} className="sm:hidden" />
            <UserAvatar src={profile.avatar} name={profile.name} px={96} className="hidden sm:inline-flex" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Logo variant="mono-white" size="sm" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-white">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge
                  role={profile.role}
                  isVerified={profile.isVerifiedTeacher}
                  label={roles(profile.role)}
                />
                <Badge variant="outline" className="gap-1 border-white/30 text-xs text-white/80">
                  <Award className="size-3" />
                  {reputation(profile.badge ?? deriveBadge(profile.points ?? 0))}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {t('joinedAt')} {new Date(profile.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <strong className="font-semibold tabular-nums text-white">
                    {followersCount}
                  </strong>
                  <span>{t('followers')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <strong className="font-semibold tabular-nums text-white">
                    {followingCount}
                  </strong>
                  <span>{t('following')}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <PointsPill count={profile.points} />
            {!isSelf && (
              <FollowButton
                userId={profile._id}
                onChange={({ followersCount: f, followingCount: fg }) => {
                  setFollowersCount(f);
                  setFollowingCount(fg);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="exercises">
        <TabsList className="mb-6">
          <TabsTrigger value="exercises" className="cursor-pointer gap-1.5">
            <BookOpen className="size-4" />
            {t('exercises')}
          </TabsTrigger>
          <TabsTrigger value="solutions" className="cursor-pointer gap-1.5">
            <MessageCircle className="size-4" />
            {t('solutions')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercises">
          {profile.exercises && profile.exercises.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.exercises.map((ex) => (
                <Link key={ex._id} href={`/exercises/${ex._id}`}>
                  <Card className="cursor-pointer rounded-xl border border-border p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                    <h3 className="line-clamp-2 font-heading text-base font-semibold text-foreground">
                      {ex.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      {ex.difficulty && <DifficultyBadge level={ex.difficulty} />}
                      {ex.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(ex.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center rounded-xl border border-border p-10 text-center shadow-sm">
              <BookOpen className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No exercises posted yet.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="solutions">
          {profile.solutions && profile.solutions.length > 0 ? (
            <div className="space-y-3">
              {profile.solutions.map((sol) => (
                <Card key={sol._id} className="rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm font-medium text-foreground">
                    {sol.exerciseTitle ?? 'Solution'}
                  </p>
                  {sol.createdAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(sol.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center rounded-xl border border-border p-10 text-center shadow-sm">
              <MessageCircle className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No solutions submitted yet.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
