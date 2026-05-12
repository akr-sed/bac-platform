import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function resolveSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    if (IS_PRODUCTION) {
      throw new Error(
        'JWT_SECRET is required in production. Refusing to start with a default secret.'
      );
    }
    return new TextEncoder().encode('dev-secret-change-in-production');
  }
  return new TextEncoder().encode(raw);
}

const JWT_SECRET = resolveSecret();
const JWT_ALGORITHM = 'HS256' as const;

const COOKIE_NAME = 'auth-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

function buildCookie(value: string, maxAge: number): string {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAge}`,
  ];
  if (IS_PRODUCTION) parts.push('Secure');
  return parts.join('; ');
}

export function setAuthCookie(response: Response, token: string): void {
  response.headers.append('Set-Cookie', buildCookie(token, COOKIE_MAX_AGE));
}

export function clearAuthCookie(response: Response): void {
  response.headers.append('Set-Cookie', buildCookie('', 0));
}
