'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  /** Profile being viewed. */
  userId: string;
  /** Initial state hydrated by the parent — keeps SSR cheap. */
  initialFollowing?: boolean;
  /** Called after a successful toggle so the parent can refresh counts. */
  onChange?: (next: {
    following: boolean;
    followersCount: number;
    followingCount: number;
  }) => void;
  className?: string;
}

interface FollowResponse {
  following: boolean;
  followersCount: number;
  followingCount: number;
}

/**
 * Wave C1 — Follow / Unfollow button used on /profile/[id].
 *
 * Behaviour:
 *  - Optimistic toggle: UI flips instantly, server call follows, revert + toast
 *    on error.
 *  - On mount, hydrates from `/api/follow/[userId]` (cheap GET) so refreshes
 *    show the correct label even when the parent didn't pre-resolve it.
 *  - Caller must hide this component when viewing their own profile.
 */
export function FollowButton({
  userId,
  initialFollowing,
  onChange,
  className,
}: FollowButtonProps) {
  const t = useTranslations('profile');
  const [following, setFollowing] = useState<boolean>(
    Boolean(initialFollowing)
  );
  const [hydrated, setHydrated] = useState<boolean>(
    initialFollowing !== undefined
  );
  const [pending, setPending] = useState(false);

  // Hydrate from server when the parent didn't pass an initial value.
  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    fetch(`/api/follow/${userId}`)
      .then((res) => (res.ok ? (res.json() as Promise<FollowResponse>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFollowing(data.following);
      })
      .catch(() => {
        /* swallow — leave button in "follow" state */
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, hydrated]);

  const handleToggle = async () => {
    if (pending) return;
    const next = !following;
    setFollowing(next); // optimistic
    setPending(true);
    try {
      const res = await fetch(`/api/follow/${userId}`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok && res.status !== 409) {
        throw new Error(`Follow request failed (${res.status})`);
      }
      const data = (await res.json()) as FollowResponse;
      setFollowing(data.following);
      onChange?.(data);
    } catch {
      // Revert
      setFollowing(!next);
      toast.error(next ? t('followError') : t('unfollowError'));
    } finally {
      setPending(false);
    }
  };

  const label = following ? t('unfollow') : t('follow');
  const Icon = pending ? Loader2 : following ? UserCheck : UserPlus;

  return (
    <Button
      type="button"
      // White outlined when following, primary white-on-navy CTA when not —
      // mirrors the profile-header treatment in the Figma alignment spec.
      intent={following ? 'secondary-white' : 'primary-white'}
      size="sm"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={following}
      aria-label={label}
      className={cn('min-w-[120px] gap-1.5', className)}
    >
      <Icon className={cn('size-4', pending && 'animate-spin')} />
      <span>{label}</span>
    </Button>
  );
}
