import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { verifyToken } from './lib/auth';

const intlMiddleware = createMiddleware(routing);

const protectedPaths = ['/profile', '/exercises/new', '/dashboard'];
const adminPaths = ['/admin'];
const authPaths = ['/login', '/register'];

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|fr|ar)/, '') || '/';
}

function extractLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|fr|ar)/);
  return match ? match[1] : 'en';
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const stripped = stripLocale(pathname);
  const locale = extractLocale(pathname);

  const token = request.cookies.get('auth-token')?.value;
  const session = token ? await verifyToken(token) : null;

  if (session && authPaths.some((p) => stripped.startsWith(p))) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  if (!session && protectedPaths.some((p) => stripped.startsWith(p))) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (adminPaths.some((p) => stripped.startsWith(p))) {
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
