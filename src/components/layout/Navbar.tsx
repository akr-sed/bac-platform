'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Menu, LogOut, Bell, Search, ChevronDown } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import LocaleSwitcher from './LocaleSwitcher';

// Spec §4.8 — Navbar visual rebuild
// Desktop ≥1024px: h-72px, bg-white/85 backdrop-blur, sticky top-0 z-50
// Mobile <1024px:  h-64px, same bg/border, bottom-sheet nav

export default function Navbar() {
  const t = useTranslations('navigation');
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count when logged in
  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications?limit=1&unread=1')
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, [user]);

  const navLinks = [
    { href: '/' as const, label: t('home') },
    { href: '/exercises' as const, label: t('exercises') },
    { href: '/library' as const, label: t('library') },
    { href: '/sessions' as const, label: t('sessions') },
  ];

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#BBC8D4] bg-white/85 backdrop-blur-md">
      {/* ─── Desktop nav (≥1024px) ──────────────────────────────────────── */}
      <nav className="mx-auto hidden h-[72px] max-w-7xl items-center justify-between px-6 lg:flex lg:px-8">
        {/* Start: Logo */}
        <Link
          href={user ? '/exercises' : '/'}
          className="shrink-0 transition-opacity hover:opacity-80"
          aria-label="NAJAH — Home"
        >
          <Logo variant="horizontal" size="sm" />
        </Link>

        {/* Centre: Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative cursor-pointer rounded-[12px] px-4 py-2',
                'font-semibold text-base text-[#25313C]',
                'transition-colors duration-[var(--motion-fast)]',
                'hover:bg-[#E6F4FA] hover:text-[#0095D1]',
                isActive(link.href) && [
                  'text-[#0095D1]',
                  'after:absolute after:bottom-0 after:start-4 after:end-4',
                  'after:h-0.5 after:rounded-full after:bg-[#0095D1]',
                ]
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* End: Locale + Bell + Auth */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {/* Search icon */}
          <Link
            href="/search"
            aria-label={t('search') || 'Search'}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'relative cursor-pointer size-10 rounded-[12px]'
            )}
          >
            <Search className="size-5 text-[#6D7D8B]" />
          </Link>

          {/* Notification bell — links to /notifications with unread dot */}
          {user && (
            <Link
              href="/notifications"
              aria-label="Notifications"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'relative cursor-pointer size-10 rounded-[12px]'
              )}
            >
              <Bell className="size-5 text-[#6D7D8B]" />
              {unreadCount > 0 && (
                <span
                  className="absolute end-1.5 top-1.5 size-2 rounded-full bg-[#ED2D30]"
                  aria-hidden="true"
                />
              )}
            </Link>
          )}

          {/* Auth section */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer gap-2 rounded-[12px] h-10 px-3"
                  />
                }
              >
                <UserAvatar src={user.avatar} name={user.name} size="sm" />
                <span className="max-w-[120px] truncate text-sm font-semibold text-[#25313C]">
                  {user.name}
                </span>
                <ChevronDown className="size-4 text-[#6D7D8B]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  render={<Link href="/dashboard" />}
                  className="cursor-pointer"
                >
                  Dashboard
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
                  {t('notifications') || 'Notifications'}
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
                  {t('leaderboard') || 'Leaderboard'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href="/settings" />}
                  className="cursor-pointer"
                >
                  {t('settings') || 'Settings'}
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
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'cursor-pointer rounded-[12px]'
                )}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ intent: 'primary-blue', size: 'sm' }),
                  'cursor-pointer rounded-[12px]'
                )}
              >
                {t('register')}
              </Link>
            </div>
          ) : null}
        </div>
      </nav>

      {/* ─── Mobile nav (<1024px) ─────────────────────────────────────────── */}
      <nav className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 lg:hidden">
        {/* Mobile: Hamburger */}
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer size-10 rounded-[12px]"
              />
            }
          >
            <Menu className="size-5 text-[#25313C]" />
            <span className="sr-only">Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6 bg-white border-e border-[#BBC8D4] rtl:border-e-0 rtl:border-s rtl:!left-auto rtl:!right-0">
            <div className="flex flex-col gap-4 pt-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'cursor-pointer rounded-[12px] px-3 py-2',
                    'font-semibold text-sm',
                    'transition-colors duration-[var(--motion-fast)]',
                    isActive(link.href)
                      ? 'text-[#0095D1] bg-[#E6F4FA]'
                      : 'text-[#25313C] hover:bg-[#E6F4FA] hover:text-[#0095D1]'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {!loading && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="cursor-pointer rounded-[12px] px-3 py-2 font-semibold text-sm text-[#25313C] transition-colors hover:bg-[#E6F4FA] hover:text-[#0095D1]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="cursor-pointer rounded-[12px] px-3 py-2 font-semibold text-sm text-[#25313C] transition-colors hover:bg-[#E6F4FA] hover:text-[#0095D1]"
                  >
                    {t('profile')}
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="cursor-pointer rounded-[12px] px-3 py-2 font-semibold text-sm text-[#25313C] transition-colors hover:bg-[#E6F4FA] hover:text-[#0095D1]"
                    >
                      {t('admin')}
                    </Link>
                  )}
                  <div className="my-2 border-t border-[#BBC8D4]" />
                  <LocaleSwitcher />
                  <Button
                    variant="outline"
                    className="cursor-pointer w-full"
                    onClick={() => {
                      logout();
                      window.location.href = '/';
                    }}
                  >
                    <LogOut className="me-2 size-4" />
                    {t('logout')}
                  </Button>
                </>
              ) : !loading ? (
                <>
                  <div className="my-2 border-t border-[#BBC8D4]" />
                  <LocaleSwitcher />
                  <div className="flex flex-col gap-2 pt-2">
                    <Link
                      href="/login"
                      className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      className={cn(buttonVariants({ intent: 'primary-blue' }), 'cursor-pointer')}
                    >
                      {t('register')}
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>

        {/* Centre: Logo mark */}
        <Link href={user ? '/exercises' : '/'} aria-label="NAJAH — Home">
          <Logo variant="mark" size={32} />
        </Link>

        {/* End: Avatar or bell */}
        {!loading && user ? (
          <Link href="/profile" aria-label={t('profile')}>
            <UserAvatar src={user.avatar} name={user.name} size="sm" />
          </Link>
        ) : !loading ? (
          <Link
            href="/login"
            className={cn(
              buttonVariants({ intent: 'primary-blue', size: 'sm' }),
              'cursor-pointer rounded-[12px]'
            )}
          >
            {t('login')}
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
