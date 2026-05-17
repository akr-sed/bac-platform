'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import {
  Home,
  BarChart3,
  Video,
  Trophy,
  BookOpen,
  Bookmark,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

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
// All keys come from the 'navigation' namespace

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/settings', labelKey: 'settings', icon: Settings },
];

export function VerticalNavRail() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { user } = useAuth();

  const isTeacherView = user?.role === 'teacher' || user?.role === 'admin';
  const mainItems = isTeacherView ? TEACHER_MAIN_ITEMS : STUDENT_MAIN_ITEMS;

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="flex h-full w-[256px] shrink-0 flex-col rounded-[12px] border-e border-[#D9EFF8] bg-white py-5 px-4"
      aria-label="Primary navigation"
    >
      {/* Teacher header — only shown for teachers/admins */}
      {isTeacherView && (
        <div className="mb-4 border-b border-[rgba(190,200,209,0.3)] pb-4">
          <h2 className="text-[24px] font-bold leading-tight text-[#0095D1]">
            {t('teacherHeader')}
          </h2>
          <p className="mt-1 text-[14px] text-[#3E4850]">
            {t('teacherSubtitle')}
          </p>
        </div>
      )}

      {/* Main nav items */}
      <ul className="flex flex-col gap-1" role="list">
        {mainItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href as '/'}
                className={cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-end transition-colors duration-150',
                  'text-base font-bold',
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
                <span className="flex-1 text-start">{t(item.labelKey as 'home')}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom items */}
      <ul className="flex flex-col gap-1 border-t border-[#D9EFF8] pt-4" role="list">
        {BOTTOM_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href as '/settings'}
              className="flex items-center gap-3 rounded-[10px] bg-[#D9EFF8] px-3 py-2.5 text-base font-bold text-[#3E4850] transition-colors duration-150 hover:bg-[#C7DEE9]"
            >
              <item.icon className="size-5 shrink-0 text-[#3E4850]" />
              <span className="flex-1 text-start">{t(item.labelKey as 'settings')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default VerticalNavRail;
