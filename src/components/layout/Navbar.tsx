'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Bell, ChevronDown, LogOut, Search, Sparkles, Flame } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { MobileNavDrawer } from './MobileNavDrawer';

// Wave 6-A — TopAppBar
// h-[84px] bg-white border-b border-[#D9EFF8]
// User pill (start) | Search (center) | Brand (end)

export function TopAppBar() {
  const t = useTranslations('navigation');
  const tg = useTranslations('gamification');
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [gamification, setGamification] = useState<{
    streakDays: number;
    xp: number;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications?limit=1&unread=1', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // `cache: 'no-store'` bypasses the browser HTTP cache so freshly-earned
    // XP and streak progress appear immediately rather than after a refresh.
    fetch('/api/gamification/summary', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setGamification({ streakDays: d.user.streakDays, xp: d.user.xp });
        }
      })
      .catch(() => {});
  }, [user]);

  const searchPlaceholder = tg('searchPlaceholder');

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 h-[84px] border-b border-[#D9EFF8] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-6 py-3">

        {/* ── Mobile burger (lg:hidden) — drives the MobileNavDrawer ── */}
        <MobileNavDrawer />

        {/* ── Start: User pill (auth) or Login/Register (unauth) ─── */}
        {!loading && user ? (
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex cursor-pointer items-center gap-2 rounded-full py-1 ps-1 pe-3 transition-colors hover:bg-[#E6F4FA]" />
                }
              >
                {/* Avatar with ring */}
                <span className="relative">
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    size="sm"
                    className="ring-2 ring-[#0095D1]"
                  />
                </span>
                <span className="hidden max-w-[100px] truncate text-sm font-semibold text-[#171C20] sm:block">
                  {user.name}
                </span>
                <ChevronDown className="size-3.5 text-[#6B7280]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem
                  render={<Link href="/" />}
                  className={cn('cursor-pointer', isActive('/') && 'text-[#0095D1]')}
                >
                  {t('home')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/profile" />}
                  className="cursor-pointer"
                >
                  {t('profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/notifications" />}
                  className="cursor-pointer"
                >
                  {t('notifications')}
                  {unreadCount > 0 && (
                    <span className="ms-auto flex size-5 items-center justify-center rounded-full bg-[#ED2D30] text-[10px] font-extrabold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/leaderboard" />}
                  className="cursor-pointer"
                >
                  {t('leaderboard')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/settings" />}
                  className="cursor-pointer"
                >
                  {t('settings')}
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem
                    render={<Link href="/admin" />}
                    className="cursor-pointer"
                  >
                    {t('admin')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-[#ED2D30] focus:text-[#ED2D30]"
                  onClick={async () => {
                    await logout();
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="me-2 size-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Streak chip — links to profile dashboard where the full streak breakdown lives */}
            {gamification && gamification.streakDays > 0 && (
              <Link
                href="/profile"
                aria-label={tg('streakLabel')}
                className="hidden items-center gap-1 rounded-full border border-[#FFEDD5] bg-[#FFF7ED] px-3 py-1.5 text-xs font-semibold text-[#EA580C] transition-colors hover:bg-[#FFEDD5] sm:flex"
              >
                <Flame className="size-3.5" />
                {gamification.streakDays} {tg('streakLabel')}
              </Link>
            )}

            {/* XP chip — links to profile dashboard where XP / level / rank are shown in full */}
            {gamification && (
              <Link
                href="/profile"
                aria-label={tg('xp')}
                className="hidden items-center gap-1 rounded-full bg-[#C7E7FF] px-3 py-1 text-xs font-bold text-[#00709D] transition-colors hover:bg-[#A8DBF5] sm:flex"
              >
                <Sparkles className="size-3.5" />
                {gamification.xp} {tg('xp')}
              </Link>
            )}

            {/* Notification bell */}
            <Link
              href="/notifications"
              aria-label={t('notifications')}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'relative size-9 cursor-pointer rounded-full'
              )}
            >
              <Bell className="size-4 text-[#6B7280]" />
              {unreadCount > 0 && (
                <span className="absolute end-1 top-1 size-2 rounded-full bg-[#ED2D30]" aria-hidden="true" />
              )}
            </Link>
          </div>
        ) : !loading ? (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'cursor-pointer rounded-[12px]')}
            >
              {t('login')}
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ intent: 'primary-blue', size: 'sm' }), 'cursor-pointer rounded-[12px]')}
            >
              {t('register')}
            </Link>
          </div>
        ) : null}

        {/* ── Center: Search bar ────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 justify-center">
          <Link
            href="/search"
            className="flex w-full max-w-[614px] items-center gap-3 rounded-full border border-[#B0DEF1] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:border-[#0095D1]"
          >
            <Search className="size-4 shrink-0 text-[#6B7280]" />
            <span className="text-sm font-semibold text-[#6B7280]">{searchPlaceholder}</span>
          </Link>
        </div>

        {/* ── End: Brand wordmark ──────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={user ? '/' : '/'}
            aria-label="NAJAH — Home"
            className="transition-opacity hover:opacity-80"
          >
            <Logo variant="horizontal" size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// Back-compat default export — existing imports of `Navbar` still work
export default TopAppBar;

// Named alias for explicit consumers
export const Navbar = TopAppBar;
