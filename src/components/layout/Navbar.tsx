'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { GraduationCap, Menu, Moon, Sun, LogOut } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useTheme } from 'next-themes';
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

export default function Navbar() {
  const t = useTranslations('navigation');
  const { setTheme, resolvedTheme } = useTheme();
  const { user, loading, logout } = useAuth();

  const navLinks = [
    { href: '/' as const, label: t('home') },
    { href: '/exercises' as const, label: t('exercises') },
    { href: '/sessions' as const, label: t('sessions') },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Desktop nav */}
        <div className="flex items-center gap-6">
          <Link
            href={user ? '/exercises' : '/'}
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground transition-colors duration-200 hover:text-primary"
          >
            <GraduationCap className="size-6 text-primary" />
            <span className="font-heading">BAC Platform</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />

          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>

          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className="cursor-pointer gap-2" />}
              >
                <UserAvatar src={user.avatar} name={user.name} size="sm" />
                <span className="max-w-[120px] truncate text-sm">{user.name}</span>
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
                  className="cursor-pointer text-destructive"
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
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'cursor-pointer')}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'sm' }), 'cursor-pointer')}
              >
                {t('register')}
              </Link>
            </>
          ) : null}
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>

          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="cursor-pointer" />}
            >
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <div className="flex flex-col gap-4 pt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}

                {!loading && user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    >
                      {t('profile')}
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                      >
                        {t('admin')}
                      </Link>
                    )}
                    <div className="my-2 border-t border-border" />
                    <LocaleSwitcher />
                    <Button
                      variant="outline"
                      className="cursor-pointer"
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
                    <div className="my-2 border-t border-border" />
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
                        className={cn(buttonVariants(), 'cursor-pointer')}
                      >
                        {t('register')}
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
