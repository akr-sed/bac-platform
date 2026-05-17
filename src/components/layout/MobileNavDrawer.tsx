'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  Home,
  BarChart3,
  Video,
  Trophy,
  BookOpen,
  Bookmark,
  Sparkles,
  Settings,
  Menu,
  LogOut,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import LocaleSwitcher from './LocaleSwitcher';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Mirror VerticalNavRail so the drawer is the mobile twin of the rail.
const STUDENT_MAIN_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home', icon: Home },
  { href: '/profile', labelKey: 'dashboard', icon: BarChart3 },
  { href: '/sessions', labelKey: 'liveSessions', icon: Video },
  { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
  { href: '/library', labelKey: 'library', icon: BookOpen },
  { href: '/saves', labelKey: 'saved', icon: Bookmark },
  { href: '/tutor', labelKey: 'tutor', icon: Sparkles },
];

const TEACHER_MAIN_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home', icon: Home },
  { href: '/library', labelKey: 'exerciseBank', icon: BookOpen },
  { href: '/sessions', labelKey: 'myLiveSessions', icon: Video },
  { href: '/statistics', labelKey: 'statistics', icon: BarChart3 },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/settings', labelKey: 'settings', icon: Settings },
];

/**
 * MobileNavDrawer — burger button + sheet that mirrors VerticalNavRail.
 *
 * The sheet primitive (base-ui Dialog) only supports physical sides, so we
 * map "start" → right in RTL (ar) and → left in LTR (fr/en) ourselves.
 */
export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const locale = useLocale();
  const { user, logout } = useAuth();

  const isRtl = locale === 'ar';
  const side: 'left' | 'right' = isRtl ? 'right' : 'left';

  const isTeacherView = user?.role === 'teacher' || user?.role === 'admin';
  const mainItems = isTeacherView ? TEACHER_MAIN_ITEMS : STUDENT_MAIN_ITEMS;

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden cursor-pointer h-10 w-10 lg:h-9 lg:w-9"
            aria-label={t('home')}
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side={side}
        className="flex w-[18rem] max-w-[88vw] flex-col gap-0 bg-white p-0"
      >
        <SheetTitle className="sr-only">{t('home')}</SheetTitle>

        {/* Visible close affordance — positioned at the logical end of the
            drawer header so RTL/LTR both put it opposite the sheet edge. */}
        <div className="flex items-center justify-end px-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label={tCommon('close')}
            className="h-9 w-9 cursor-pointer"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Teacher header — sits above the user pill so teachers immediately
            see the dashboard context. Students keep the original layout. */}
        {isTeacherView && (
          <div className="border-b border-[rgba(190,200,209,0.3)] px-4 py-4">
            <h2 className="text-[20px] font-bold leading-tight text-[#0095D1]">
              {t('teacherHeader')}
            </h2>
            <p className="mt-1 text-[13px] text-[#3E4850]">
              {t('teacherSubtitle')}
            </p>
          </div>
        )}

        {/* User pill / auth actions */}
        <div className="border-b border-[#D9EFF8] px-4 py-4">
          {user ? (
            <div className="flex items-center gap-3">
              <UserAvatar
                src={user.avatar}
                name={user.name}
                size="sm"
                className="ring-2 ring-[#0095D1]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#171C20]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[#3E4850]">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={close}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'cursor-pointer rounded-[12px]'
                )}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={close}
                className={cn(
                  buttonVariants({ intent: 'primary-blue', size: 'sm' }),
                  'cursor-pointer rounded-[12px]'
                )}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        {/* Main nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
          <ul className="flex flex-col gap-1" role="list">
            {mainItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href as '/'}
                    onClick={close}
                    className={cn(
                      'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-base font-bold transition-colors duration-150',
                      active
                        ? 'bg-[#E6F4FA] text-[#0095D1]'
                        : 'text-[#003449] hover:bg-[#D9EFF8]'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'size-5 shrink-0',
                        active ? 'text-[#0095D1]' : 'text-[#3E4850]'
                      )}
                    />
                    <span className="flex-1 text-start">
                      {t(item.labelKey as 'home')}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Locale switcher — mobile users have no access to the footer's
              switcher without scrolling the whole page, so surface it here. */}
          <div className="mt-4 px-1">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              {t('language')}
            </p>
            <LocaleSwitcher />
          </div>

          {/* Divider between main and footer items */}
          <div className="my-4 border-t border-[#D9EFF8]" />

          <ul className="flex flex-col gap-1" role="list">
            {BOTTOM_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href as '/settings'}
                  onClick={close}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-base font-bold text-[#3E4850] transition-colors duration-150 hover:bg-[#D9EFF8]"
                >
                  <item.icon className="size-5 shrink-0 text-[#3E4850]" />
                  <span className="flex-1 text-start">
                    {t(item.labelKey as 'settings')}
                  </span>
                </Link>
              </li>
            ))}
            {user && (
              <li>
                <button
                  type="button"
                  onClick={async () => {
                    close();
                    await logout();
                    window.location.href = '/';
                  }}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-start text-base font-bold text-[#ED2D30] transition-colors duration-150 hover:bg-[#FEE2E2]"
                >
                  <LogOut className="size-5 shrink-0" />
                  <span className="flex-1 text-start">{t('logout')}</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNavDrawer;
