# BAC Platform Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional collaborative BAC exercise practice and learning platform covering authentication, exercise management, solutions, comments, reputation, moderation, and localization — everything except AI features.

**Architecture:** Next.js 16 App Router with Server Components by default, Client Components only where interactivity is needed. MongoDB via Mongoose for persistence. JWT auth with HTTP-only cookies. Cloudinary for file uploads. next-intl for i18n (en/fr/ar with RTL). API routes under `/api/` handle all mutations and data fetching for client components.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, MongoDB + Mongoose, jose (JWT), bcryptjs, Cloudinary, next-intl, zod, react-hook-form

**User Stories Covered:** US1-US15, US18-US20 (skipping US16-US17 AI features)

---

## File Map

```
src/
├── app/
│   ├── globals.css                          (modify — add shadcn theme vars)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts            (create — POST register)
│   │   │   ├── login/route.ts               (create — POST login)
│   │   │   ├── logout/route.ts              (create — POST logout)
│   │   │   └── me/route.ts                  (create — GET current user)
│   │   ├── exercises/
│   │   │   ├── route.ts                     (create — GET list, POST create)
│   │   │   └── [id]/route.ts                (create — GET detail, DELETE)
│   │   ├── solutions/
│   │   │   ├── route.ts                     (create — POST create)
│   │   │   └── [id]/
│   │   │       ├── route.ts                 (create — DELETE)
│   │   │       ├── like/route.ts            (create — POST toggle like)
│   │   │       └── comments/route.ts        (create — GET list, POST create)
│   │   ├── comments/
│   │   │   └── [id]/route.ts                (create — DELETE)
│   │   ├── users/
│   │   │   └── [id]/route.ts                (create — GET profile)
│   │   ├── admin/
│   │   │   ├── users/route.ts               (create — GET all users)
│   │   │   ├── verify-teacher/route.ts      (create — POST verify/revoke)
│   │   │   ├── reports/route.ts             (create — GET list, POST create)
│   │   │   └── stats/route.ts               (create — GET dashboard stats)
│   │   └── upload/route.ts                  (create — POST file upload)
│   └── [locale]/
│       ├── layout.tsx                       (modify — wrap with AuthProvider)
│       ├── page.tsx                         (modify — real landing page)
│       ├── (auth)/
│       │   ├── login/page.tsx               (modify — real login form)
│       │   └── register/page.tsx            (modify — real register form)
│       ├── exercises/
│       │   ├── page.tsx                     (modify — real listing with filters)
│       │   ├── new/page.tsx                 (create — post exercise form)
│       │   └── [id]/page.tsx                (modify — real detail + solutions)
│       ├── profile/
│       │   ├── page.tsx                     (modify — current user profile)
│       │   └── [userId]/page.tsx            (create — public user profile)
│       └── admin/
│           ├── page.tsx                     (modify — real dashboard)
│           ├── users/page.tsx               (create — user management)
│           └── reports/page.tsx             (create — reports management)
├── components/
│   ├── ui/                                  (created by shadcn init)
│   ├── layout/
│   │   ├── Navbar.tsx                       (modify — auth-aware)
│   │   └── LocaleSwitcher.tsx               (existing, keep as-is)
│   ├── auth/
│   │   ├── AuthProvider.tsx                 (create — client auth context)
│   │   ├── LoginForm.tsx                    (create — client form)
│   │   └── RegisterForm.tsx                 (create — client form)
│   ├── exercises/
│   │   ├── ExerciseCard.tsx                 (create — card component)
│   │   ├── ExerciseList.tsx                 (create — list with pagination)
│   │   ├── ExerciseFilters.tsx              (create — filter sidebar)
│   │   └── ExerciseForm.tsx                 (create — create/edit form)
│   ├── solutions/
│   │   ├── SolutionCard.tsx                 (create — card with like)
│   │   ├── SolutionList.tsx                 (create — list for exercise)
│   │   ├── SolutionForm.tsx                 (create — submit form)
│   │   └── LikeButton.tsx                   (create — toggle like)
│   ├── comments/
│   │   ├── CommentList.tsx                  (create — list of comments)
│   │   └── CommentForm.tsx                  (create — add comment)
│   ├── profile/
│   │   ├── ProfileCard.tsx                  (create — user info card)
│   │   └── ReputationBadge.tsx              (create — badge display)
│   └── admin/
│       ├── StatsCards.tsx                   (create — dashboard stats)
│       ├── UserTable.tsx                    (create — user management)
│       ├── ReportTable.tsx                  (create — reports list)
│       └── DeleteButton.tsx                 (create — confirm delete)
├── context/
│   └── auth-context.ts                      (create — auth context definition)
├── lib/
│   ├── mongodb.ts                           (existing, keep as-is)
│   ├── auth.ts                              (create — JWT sign/verify/getSession)
│   ├── cloudinary.ts                        (create — upload helper)
│   └── utils.ts                             (create — shadcn cn() utility)
├── models/
│   ├── User.ts                              (existing, keep as-is)
│   ├── Exercise.ts                          (existing, keep as-is)
│   ├── Solution.ts                          (existing, keep as-is)
│   ├── Comment.ts                           (existing, keep as-is)
│   └── Report.ts                            (create — report model)
├── middleware.ts                             (create — replace proxy.ts, auth + i18n)
├── i18n/
│   ├── routing.ts                           (existing, keep as-is)
│   └── request.ts                           (existing, keep as-is)
└── types/
    └── index.ts                             (create — shared DTOs)

messages/
├── en.json                                  (existing, minor additions)
├── fr.json                                  (modify — complete translations)
└── ar.json                                  (modify — complete translations)

components.json                              (created by shadcn init)
```

---

## Phase 1: Foundation & Setup

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install jose bcryptjs cloudinary zod react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D @types/bcryptjs
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install auth, upload, and form dependencies"
```

---

### Task 2: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Modify: `src/app/globals.css`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**
- `tailwind.config.*` path: let it auto-detect or use `tailwind.config.ts`
- Components alias: `@/components`
- Utils alias: `@/lib/utils`

> **Note:** Tailwind CSS v4 uses a CSS-first config approach. shadcn/ui v2+ supports this. If the CLI asks about `globals.css`, point it to `src/app/globals.css`.

- [ ] **Step 2: Install the shadcn components we need**

```bash
npx shadcn@latest add button input label card badge avatar dialog dropdown-menu select textarea separator tabs table alert toast sonner
```

- [ ] **Step 3: Verify globals.css has CSS variables**

Read `src/app/globals.css` and confirm shadcn added its CSS variables (`:root` block with `--background`, `--foreground`, etc.). If not, the init may have created a separate file — merge it into `globals.css`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize shadcn/ui with core components"
```

---

### Task 3: Create shared TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/index.ts

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  points: number;
  isVerifiedTeacher: boolean;
  createdAt: string;
}

export interface ExerciseDTO {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  subtopic: string;
  author: UserDTO;
  attachments: string[];
  solutionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SolutionDTO {
  _id: string;
  exerciseId: string;
  author: UserDTO;
  content: string;
  images: string[];
  likes: string[];
  likesCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  _id: string;
  solutionId: string;
  author: UserDTO;
  content: string;
  createdAt: string;
}

export interface ReportDTO {
  _id: string;
  reportedBy: UserDTO;
  targetType: 'exercise' | 'solution' | 'comment' | 'user';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "chore: add shared TypeScript DTO types"
```

---

### Task 4: Create auth utility (JWT helpers)

**Files:**
- Create: `src/lib/auth.ts`
- Modify: `.env.local.example` (add `JWT_SECRET`)

- [ ] **Step 1: Create the auth library**

```typescript
// src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);

const COOKIE_NAME = 'auth-token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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

export function setAuthCookie(
  response: Response,
  token: string
): void {
  const cookie = `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`;
  response.headers.append('Set-Cookie', cookie);
}

export function clearAuthCookie(response: Response): void {
  const cookie = `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
  response.headers.append('Set-Cookie', cookie);
}
```

- [ ] **Step 2: Add JWT_SECRET to .env.local.example**

Add this line to `.env.local.example`:
```
JWT_SECRET=your_jwt_secret_here_change_in_production
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts .env.local.example
git commit -m "feat: add JWT auth utility with sign/verify/session helpers"
```

---

### Task 5: Create Cloudinary upload utility

**Files:**
- Create: `src/lib/cloudinary.ts`
- Modify: `.env.local.example` (add Cloudinary vars)

- [ ] **Step 1: Create the cloudinary library**

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(
  file: File,
  folder: string = 'bac-platform'
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
          max_bytes: 5 * 1024 * 1024,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      )
      .end(buffer);
  });
}

export default cloudinary;
```

- [ ] **Step 2: Add Cloudinary vars to .env.local.example**

Add these lines:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cloudinary.ts .env.local.example
git commit -m "feat: add Cloudinary upload utility"
```

---

### Task 6: Create Report model

**Files:**
- Create: `src/models/Report.ts`

- [ ] **Step 1: Create the Report model**

```typescript
// src/models/Report.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReport extends Document {
  reportedBy: Types.ObjectId;
  targetType: 'exercise' | 'solution' | 'comment' | 'user';
  targetId: Types.ObjectId;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['exercise', 'solution', 'comment', 'user'] as const,
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'] as const,
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Report: Model<IReport> =
  (mongoose.models.Report as Model<IReport>) ??
  mongoose.model<IReport>('Report', ReportSchema);

export default Report;
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Report.ts
git commit -m "feat: add Report mongoose model"
```

---

### Task 7: Create middleware (auth + i18n combined)

**Files:**
- Create: `src/middleware.ts`
- Delete: `src/proxy.ts` (replaced)

The current `src/proxy.ts` handles only i18n routing. We need a proper `src/middleware.ts` that handles both i18n and auth-protected routes.

- [ ] **Step 1: Create the combined middleware**

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { verifyToken } from './lib/auth';

const intlMiddleware = createMiddleware(routing);

const protectedPaths = ['/profile', '/exercises/new'];
const adminPaths = ['/admin'];
const authPaths = ['/login', '/register'];

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|fr|ar)/, '') || '/';
}

function extractLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|fr|ar)/);
  return match ? match[1] : 'en';
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const stripped = stripLocale(pathname);
  const locale = extractLocale(pathname);

  const token = request.cookies.get('auth-token')?.value;
  const session = token ? await verifyToken(token) : null;

  // Redirect logged-in users away from auth pages
  if (session && authPaths.some((p) => stripped.startsWith(p))) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Protect authenticated routes
  if (!session && protectedPaths.some((p) => stripped.startsWith(p))) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Protect admin routes
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
```

- [ ] **Step 2: Delete the old proxy.ts**

```bash
rm src/proxy.ts
```

- [ ] **Step 3: Verify the app still loads**

```bash
npm run dev
```

Open `http://localhost:3000` — verify the home page loads with locale routing working.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git rm src/proxy.ts
git commit -m "feat: replace proxy.ts with combined auth + i18n middleware"
```

---

### Task 8: Create file upload API route

**Files:**
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Create the upload endpoint**

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/cloudinary';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFile(file, 'bac-platform');
    urls.push(url);
  }

  return NextResponse.json({ urls });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "feat: add file upload API route with Cloudinary"
```

---

## Phase 2: Authentication (US1, US2)

### Task 9: Create auth API routes

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

- [ ] **Step 1: Create register route**

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points,
          isVerifiedTeacher: user.isVerifiedTeacher,
        },
      },
      { status: 201 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create login route**

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        isVerifiedTeacher: user.isVerifiedTeacher,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create logout route**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
```

- [ ] **Step 4: Create me route**

```typescript
// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  await connectToDatabase();
  const user = await User.findById(session.userId).select('-passwordHash');
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      isVerifiedTeacher: user.isVerifiedTeacher,
      createdAt: user.createdAt,
    },
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add auth API routes (register, login, logout, me)"
```

---

### Task 10: Create AuthProvider (client context)

**Files:**
- Create: `src/context/auth-context.ts`
- Create: `src/components/auth/AuthProvider.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create the auth context definition**

```typescript
// src/context/auth-context.ts
'use client';

import { createContext, useContext } from 'react';
import type { UserDTO } from '@/types';

export interface AuthContextType {
  user: UserDTO | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Create the AuthProvider component**

```tsx
// src/components/auth/AuthProvider.tsx
'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from '@/i18n/routing';
import { AuthContext } from '@/context/auth-context';
import type { UserDTO } from '@/types';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 3: Wrap the locale layout with AuthProvider**

Modify `src/app/[locale]/layout.tsx` — wrap children inside `<AuthProvider>`:

```tsx
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import AuthProvider from '@/components/auth/AuthProvider';
import { routing } from '@/i18n/routing';
import '../globals.css';

export const metadata: Metadata = {
  title: 'BAC Platform',
  description: 'Collaborative BAC exercise practice and learning platform',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <div className="min-h-screen">
              <Navbar />
              <main>{children}</main>
            </div>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/context/auth-context.ts src/components/auth/AuthProvider.tsx src/app/\[locale\]/layout.tsx
git commit -m "feat: add AuthProvider with client-side session context"
```

---

### Task 11: Build login form

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Modify: `src/app/[locale]/(auth)/login/page.tsx`

- [ ] **Step 1: Create the LoginForm client component**

```tsx
// src/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginForm() {
  const t = useTranslations('auth.login');
  const tErrors = useTranslations('auth.errors');
  const { refresh } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error === 'Invalid credentials' ? tErrors('invalidCredentials') : tErrors('serverError'));
        return;
      }

      await refresh();
      router.push('/');
      router.refresh();
    } catch {
      setError(tErrors('serverError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('noAccount')}{' '}
          <Link href="/register" className="text-primary underline">{t('registerLink')}</Link>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : t('submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Update the login page**

```tsx
// src/app/[locale]/(auth)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/LoginForm.tsx src/app/\[locale\]/\(auth\)/login/page.tsx
git commit -m "feat: build login form with email/password auth"
```

---

### Task 12: Build register form

**Files:**
- Create: `src/components/auth/RegisterForm.tsx`
- Modify: `src/app/[locale]/(auth)/register/page.tsx`

- [ ] **Step 1: Create the RegisterForm client component**

```tsx
// src/components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterForm() {
  const t = useTranslations('auth.register');
  const tErrors = useTranslations('auth.errors');
  const { refresh } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError(tErrors('passwordMismatch'));
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError(tErrors('weakPassword'));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) setError(tErrors('emailTaken'));
        else setError(data.error || tErrors('serverError'));
        return;
      }

      await refresh();
      router.push('/');
      router.refresh();
    } catch {
      setError(tErrors('serverError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('hasAccount')}{' '}
          <Link href="/login" className="text-primary underline">{t('loginLink')}</Link>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" name="name" type="text" required autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : t('submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Update the register page**

```tsx
// src/app/[locale]/(auth)/register/page.tsx
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <RegisterForm />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/RegisterForm.tsx src/app/\[locale\]/\(auth\)/register/page.tsx
git commit -m "feat: build register form with validation"
```

---

### Task 13: Update Navbar with auth state

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

The Navbar needs to show different links based on whether the user is logged in. Since we need client-side reactivity (useAuth hook), the Navbar becomes a client component.

- [ ] **Step 1: Rewrite Navbar as auth-aware client component**

```tsx
// src/components/layout/Navbar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/context/auth-context';
import LocaleSwitcher from './LocaleSwitcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
  const t = useTranslations('navigation');
  const tRoles = useTranslations('roles');
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-950">
            BAC Platform
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <Link href="/" className="transition hover:text-slate-950">
              {t('home')}
            </Link>
            <Link href="/exercises" className="transition hover:text-slate-950">
              {t('exercises')}
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="transition hover:text-slate-950">
                {t('admin')}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LocaleSwitcher />
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-slate-200" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {user.name}
                  {user.isVerifiedTeacher && (
                    <Badge variant="secondary" className="text-xs">
                      {tRoles('teacher')}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">{t('profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t('register')}</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: update Navbar with auth state, dropdown menu, and role-based links"
```

---

## Phase 3: Exercise Management (US5, US6, US7)

### Task 14: Create exercise API routes

**Files:**
- Create: `src/app/api/exercises/route.ts`
- Create: `src/app/api/exercises/[id]/route.ts`

- [ ] **Step 1: Create exercises list + create route**

```typescript
// src/app/api/exercises/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const subtopic = searchParams.get('subtopic');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 12;

    const filter: Record<string, string> = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (subtopic) filter.subtopic = subtopic;
    if (difficulty) filter.difficulty = difficulty;

    const [exercises, total] = await Promise.all([
      Exercise.find(filter)
        .populate('authorId', 'name role isVerifiedTeacher')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Exercise.countDocuments(filter),
    ]);

    // Attach solution counts
    const exerciseIds = exercises.map((e) => e._id);
    const solutionCounts = await Solution.aggregate([
      { $match: { exerciseId: { $in: exerciseIds } } },
      { $group: { _id: '$exerciseId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(solutionCounts.map((s) => [s._id.toString(), s.count]));

    const data = exercises.map((e) => ({
      ...e,
      author: e.authorId,
      authorId: undefined,
      solutionCount: countMap.get(e._id.toString()) || 0,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, difficulty, subject, topic, subtopic, attachments } = body;

    if (!title || !description || !difficulty || !subject || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const exercise = await Exercise.create({
      title: title.trim(),
      description,
      difficulty,
      subject: subject.trim(),
      topic: topic.trim(),
      subtopic: subtopic?.trim() || '',
      authorId: session.userId,
      attachments: attachments || [],
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create exercise detail + delete route**

```typescript
// src/app/api/exercises/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const exercise = await Exercise.findById(id)
      .populate('authorId', 'name role isVerifiedTeacher points')
      .lean();

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    return NextResponse.json({
      exercise: { ...exercise, author: exercise.authorId, authorId: undefined },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const exercise = await Exercise.findById(id);
    if (!exercise) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only author or admin can delete
    if (exercise.authorId.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cascade: delete solutions and their comments
    const solutions = await Solution.find({ exerciseId: id });
    const solutionIds = solutions.map((s) => s._id);
    await Comment.deleteMany({ solutionId: { $in: solutionIds } });
    await Solution.deleteMany({ exerciseId: id });
    await Exercise.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/exercises/
git commit -m "feat: add exercise API routes (list, create, detail, delete)"
```

---

### Task 15: Build exercise card and list components

**Files:**
- Create: `src/components/exercises/ExerciseCard.tsx`
- Create: `src/components/exercises/ExerciseList.tsx`

- [ ] **Step 1: Create ExerciseCard**

```tsx
// src/components/exercises/ExerciseCard.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExerciseDTO } from '@/types';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export default function ExerciseCard({ exercise }: { exercise: ExerciseDTO }) {
  const t = useTranslations('exercises');
  const tDiff = useTranslations('exercises.difficulty');

  return (
    <Link href={`/exercises/${exercise._id}`}>
      <Card className="h-full transition hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">{exercise.title}</CardTitle>
            <Badge className={difficultyColors[exercise.difficulty]} variant="outline">
              {tDiff(exercise.difficulty)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">{exercise.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{exercise.subject}</Badge>
            <Badge variant="outline">{exercise.topic}</Badge>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <span>{exercise.author?.name}</span>
          <span className="mx-2">-</span>
          <span>{t('detail.solutions')}: {exercise.solutionCount}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create ExerciseList**

```tsx
// src/components/exercises/ExerciseList.tsx
'use client';

import { useTranslations } from 'next-intl';
import ExerciseCard from './ExerciseCard';
import { Button } from '@/components/ui/button';
import type { ExerciseDTO } from '@/types';

interface Props {
  exercises: ExerciseDTO[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ExerciseList({ exercises, page, totalPages, onPageChange }: Props) {
  const t = useTranslations('exercises');

  if (exercises.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t('noResults')}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise._id} exercise={exercise} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            {t('filter.all') === 'All' ? 'Previous' : t('filter.all')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            {t('filter.all') === 'All' ? 'Next' : t('filter.all')}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/exercises/
git commit -m "feat: add ExerciseCard and ExerciseList components"
```

---

### Task 16: Build exercise filter component

**Files:**
- Create: `src/components/exercises/ExerciseFilters.tsx`

- [ ] **Step 1: Create ExerciseFilters**

```tsx
// src/components/exercises/ExerciseFilters.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Filters {
  subject: string;
  topic: string;
  difficulty: string;
}

interface Props {
  filters: Filters;
  subjects: string[];
  topics: string[];
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
}

export default function ExerciseFilters({ filters, subjects, topics, onFilterChange, onReset }: Props) {
  const t = useTranslations('exercises.filter');
  const tDiff = useTranslations('exercises.difficulty');

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <div className="space-y-2">
        <Label>{t('subject')}</Label>
        <Select
          value={filters.subject || 'all'}
          onValueChange={(val) => onFilterChange({ ...filters, subject: val === 'all' ? '' : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('topic')}</Label>
        <Select
          value={filters.topic || 'all'}
          onValueChange={(val) => onFilterChange({ ...filters, topic: val === 'all' ? '' : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            {topics.map((tp) => (
              <SelectItem key={tp} value={tp}>{tp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('difficulty')}</Label>
        <Select
          value={filters.difficulty || 'all'}
          onValueChange={(val) => onFilterChange({ ...filters, difficulty: val === 'all' ? '' : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="easy">{tDiff('easy')}</SelectItem>
            <SelectItem value="medium">{tDiff('medium')}</SelectItem>
            <SelectItem value="hard">{tDiff('hard')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
        {t('all')}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/exercises/ExerciseFilters.tsx
git commit -m "feat: add ExerciseFilters component with subject/topic/difficulty"
```

---

### Task 17: Build exercises listing page

**Files:**
- Modify: `src/app/[locale]/exercises/page.tsx`

- [ ] **Step 1: Rewrite the exercises page with real data fetching and filters**

```tsx
// src/app/[locale]/exercises/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/context/auth-context';
import ExerciseList from '@/components/exercises/ExerciseList';
import ExerciseFilters from '@/components/exercises/ExerciseFilters';
import { Button } from '@/components/ui/button';
import type { ExerciseDTO } from '@/types';

export default function ExercisesPage() {
  const t = useTranslations('exercises');
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [filters, setFilters] = useState({ subject: '', topic: '', difficulty: '' });

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.topic) params.set('topic', filters.topic);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);

    const res = await fetch(`/api/exercises?${params}`);
    const data = await res.json();
    setExercises(data.data || []);
    setTotalPages(data.totalPages || 1);

    // Extract unique subjects/topics for filter dropdowns
    if (subjects.length === 0 && data.data?.length > 0) {
      const allRes = await fetch('/api/exercises?limit=1000');
      const allData = await allRes.json();
      const allExercises: ExerciseDTO[] = allData.data || [];
      setSubjects([...new Set(allExercises.map((e) => e.subject))]);
      setTopics([...new Set(allExercises.map((e) => e.topic))]);
    }

    setLoading(false);
  }, [page, filters, subjects.length]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('browse')}</h1>
        {user && (
          <Button asChild>
            <Link href="/exercises/new">{t('post')}</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside>
          <ExerciseFilters
            filters={filters}
            subjects={subjects}
            topics={topics}
            onFilterChange={(f) => { setFilters(f); setPage(1); }}
            onReset={() => { setFilters({ subject: '', topic: '', difficulty: '' }); setPage(1); }}
          />
        </aside>
        <div>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">{t('noResults')}...</div>
          ) : (
            <ExerciseList
              exercises={exercises}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/exercises/page.tsx
git commit -m "feat: build exercises listing page with filters and pagination"
```

---

### Task 18: Build exercise form and new exercise page

**Files:**
- Create: `src/components/exercises/ExerciseForm.tsx`
- Create: `src/app/[locale]/exercises/new/page.tsx`

- [ ] **Step 1: Create ExerciseForm**

```tsx
// src/components/exercises/ExerciseForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ExerciseForm() {
  const t = useTranslations('exercises');
  const tFields = useTranslations('exercises.fields');
  const tDiff = useTranslations('exercises.difficulty');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.urls) setAttachments((prev) => [...prev, ...data.urls]);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const subject = formData.get('subject') as string;
    const topic = formData.get('topic') as string;
    const subtopic = formData.get('subtopic') as string;

    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, difficulty, subject, topic, subtopic, attachments }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tCommon('error'));
        return;
      }

      const data = await res.json();
      router.push(`/exercises/${data.exercise._id}`);
    } catch {
      setError(tCommon('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t('post')}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">{tFields('title')}</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{tFields('description')}</Label>
            <Textarea id="description" name="description" rows={6} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject">{tFields('subject')}</Label>
              <Input id="subject" name="subject" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">{tFields('topic')}</Label>
              <Input id="topic" name="topic" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subtopic">{tFields('subtopic')}</Label>
              <Input id="subtopic" name="subtopic" />
            </div>
            <div className="space-y-2">
              <Label>{t('filter.difficulty')}</Label>
              <Select value={difficulty} onValueChange={setDifficulty} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{tDiff('easy')}</SelectItem>
                  <SelectItem value="medium">{tDiff('medium')}</SelectItem>
                  <SelectItem value="hard">{tDiff('hard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{tFields('attachments')}</Label>
            <Input type="file" accept="image/*,.pdf" multiple onChange={handleFileUpload} />
            {uploading && <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener" className="text-xs text-blue-600 underline">
                    File {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading || uploading}>
            {loading ? tCommon('loading') : tCommon('submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Create the new exercise page**

```tsx
// src/app/[locale]/exercises/new/page.tsx
import ExerciseForm from '@/components/exercises/ExerciseForm';

export default function NewExercisePage() {
  return (
    <div className="mx-auto flex max-w-6xl justify-center px-6 py-8">
      <ExerciseForm />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/exercises/ExerciseForm.tsx src/app/\[locale\]/exercises/new/
git commit -m "feat: add exercise creation form with file upload"
```

---

### Task 19: Build exercise detail page

**Files:**
- Modify: `src/app/[locale]/exercises/[id]/page.tsx`

This page fetches and displays the exercise, its author info, attachments, and will render the SolutionList component (built in Phase 4). For now it renders the exercise and a placeholder for solutions.

- [ ] **Step 1: Rewrite the exercise detail page**

```tsx
// src/app/[locale]/exercises/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SolutionList from '@/components/solutions/SolutionList';
import SolutionForm from '@/components/solutions/SolutionForm';
import DeleteButton from '@/components/admin/DeleteButton';
import type { ExerciseDTO, SolutionDTO } from '@/types';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('exercises');
  const tDiff = useTranslations('exercises.difficulty');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const [exercise, setExercise] = useState<ExerciseDTO | null>(null);
  const [solutions, setSolutions] = useState<SolutionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    const [exRes, solRes] = await Promise.all([
      fetch(`/api/exercises/${id}`),
      fetch(`/api/solutions?exerciseId=${id}`),
    ]);
    const exData = await exRes.json();
    const solData = await solRes.json();
    setExercise(exData.exercise || null);
    setSolutions(solData.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">{tCommon('loading')}</div>;
  if (!exercise) return <div className="p-8 text-center text-muted-foreground">Not found</div>;

  const canDelete = user && (user.role === 'admin' || user._id === exercise.author?._id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{exercise.title}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={difficultyColors[exercise.difficulty]} variant="outline">
                  {tDiff(exercise.difficulty)}
                </Badge>
                <Badge variant="secondary">{exercise.subject}</Badge>
                <Badge variant="outline">{exercise.topic}</Badge>
                {exercise.subtopic && <Badge variant="outline">{exercise.subtopic}</Badge>}
              </div>
            </div>
            {canDelete && (
              <DeleteButton
                endpoint={`/api/exercises/${exercise._id}`}
                onDeleted={() => window.history.back()}
              />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('detail.postedBy')} {exercise.author?.name} - {new Date(exercise.createdAt).toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap">{exercise.description}</div>
          {exercise.attachments?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {exercise.attachments.map((url, i) =>
                url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img key={i} src={url} alt={`Attachment ${i + 1}`} className="max-h-64 rounded border" />
                ) : (
                  <a key={i} href={url} target="_blank" rel="noopener" className="text-sm text-blue-600 underline">
                    Attachment {i + 1}
                  </a>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('detail.solutions')} ({solutions.length})</h2>
        {user && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? tCommon('close') : t('detail.noSolutions').includes('first') ? tCommon('submit') : tCommon('submit')}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <SolutionForm
            exerciseId={exercise._id}
            onSubmitted={() => { setShowForm(false); fetchData(); }}
          />
        </div>
      )}

      <SolutionList solutions={solutions} onRefresh={fetchData} />
    </div>
  );
}
```

> **Note:** This page depends on `SolutionList`, `SolutionForm`, and `DeleteButton` — built in Tasks 21, 22, and 31. During execution, build those components first or create stub exports. The subagent running this task should create minimal stubs if the components don't exist yet, then replace them when those tasks run.

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/exercises/\[id\]/page.tsx
git commit -m "feat: build exercise detail page with solutions section"
```

---

## Phase 4: Solution System (US8, US9, US10)

### Task 20: Create solution API routes

**Files:**
- Create: `src/app/api/solutions/route.ts`
- Create: `src/app/api/solutions/[id]/route.ts`
- Create: `src/app/api/solutions/[id]/like/route.ts`

- [ ] **Step 1: Create solutions list + create route**

```typescript
// src/app/api/solutions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });
    }

    const solutions = await Solution.find({ exerciseId })
      .populate('authorId', 'name role isVerifiedTeacher points')
      .sort({ createdAt: -1 })
      .lean();

    // Attach comment counts
    const solutionIds = solutions.map((s) => s._id);
    const commentCounts = await Comment.aggregate([
      { $match: { solutionId: { $in: solutionIds } } },
      { $group: { _id: '$solutionId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));

    const data = solutions
      .map((s) => ({
        ...s,
        author: s.authorId,
        authorId: undefined,
        likesCount: s.likes?.length || 0,
        commentCount: countMap.get(s._id.toString()) || 0,
      }))
      .sort((a, b) => b.likesCount - a.likesCount); // Sort by most liked

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { exerciseId, content, images } = await request.json();
    if (!exerciseId || !content) {
      return NextResponse.json({ error: 'exerciseId and content required' }, { status: 400 });
    }

    await connectToDatabase();

    const solution = await Solution.create({
      exerciseId,
      authorId: session.userId,
      content,
      images: images || [],
    });

    // Award points for posting a solution
    await User.findByIdAndUpdate(session.userId, { $inc: { points: 5 } });

    return NextResponse.json({ solution }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create solution delete route**

```typescript
// src/app/api/solutions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Solution from '@/models/Solution';
import Comment from '@/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const solution = await Solution.findById(id);
    if (!solution) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (solution.authorId.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Comment.deleteMany({ solutionId: id });
    await Solution.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create like toggle route**

```typescript
// src/app/api/solutions/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Solution from '@/models/Solution';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const solution = await Solution.findById(id);
    if (!solution) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userId = session.userId;
    const alreadyLiked = solution.likes.some((likeId) => likeId.toString() === userId);

    if (alreadyLiked) {
      await Solution.findByIdAndUpdate(id, { $pull: { likes: userId } });
      // Remove point from solution author
      await User.findByIdAndUpdate(solution.authorId, { $inc: { points: -1 } });
      return NextResponse.json({ liked: false });
    } else {
      await Solution.findByIdAndUpdate(id, { $addToSet: { likes: userId } });
      // Award point to solution author
      await User.findByIdAndUpdate(solution.authorId, { $inc: { points: 1 } });
      return NextResponse.json({ liked: true });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/solutions/
git commit -m "feat: add solution API routes (list, create, delete, like toggle)"
```

---

### Task 21: Build solution components

**Files:**
- Create: `src/components/solutions/LikeButton.tsx`
- Create: `src/components/solutions/SolutionCard.tsx`
- Create: `src/components/solutions/SolutionList.tsx`

- [ ] **Step 1: Create LikeButton**

```tsx
// src/components/solutions/LikeButton.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

interface Props {
  solutionId: string;
  likes: string[];
  onToggle: () => void;
}

export default function LikeButton({ solutionId, likes, onToggle }: Props) {
  const t = useTranslations('solutions');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isLiked = user ? likes.includes(user._id) : false;

  async function handleToggle() {
    if (!user) return;
    setLoading(true);
    await fetch(`/api/solutions/${solutionId}/like`, { method: 'POST' });
    onToggle();
    setLoading(false);
  }

  return (
    <Button
      variant={isLiked ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={!user || loading}
    >
      {isLiked ? t('unlike') : t('like')} ({likes.length})
    </Button>
  );
}
```

- [ ] **Step 2: Create SolutionCard**

```tsx
// src/components/solutions/SolutionCard.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import LikeButton from './LikeButton';
import CommentList from '@/components/comments/CommentList';
import CommentForm from '@/components/comments/CommentForm';
import DeleteButton from '@/components/admin/DeleteButton';
import type { SolutionDTO } from '@/types';

interface Props {
  solution: SolutionDTO;
  onRefresh: () => void;
}

export default function SolutionCard({ solution, onRefresh }: Props) {
  const t = useTranslations('solutions');
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  const canDelete = user && (user.role === 'admin' || user._id === solution.author?._id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <span className="font-medium">{solution.author?.name}</span>
          {solution.author?.isVerifiedTeacher && (
            <Badge variant="secondary" className="ml-2 text-xs">Teacher</Badge>
          )}
          <span className="ml-2 text-xs text-muted-foreground">
            {new Date(solution.createdAt).toLocaleDateString()}
          </span>
        </div>
        {canDelete && (
          <DeleteButton endpoint={`/api/solutions/${solution._id}`} onDeleted={onRefresh} />
        )}
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap">{solution.content}</div>
        {solution.images?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {solution.images.map((url, i) => (
              <img key={i} src={url} alt={`Image ${i + 1}`} className="max-h-48 rounded border" />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3">
        <LikeButton solutionId={solution._id} likes={solution.likes || []} onToggle={onRefresh} />
        <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
          {t('comment')} ({solution.commentCount || 0})
        </Button>
      </CardFooter>
      {showComments && (
        <div className="px-6 pb-6">
          <Separator className="mb-4" />
          <CommentList solutionId={solution._id} />
          {user && <CommentForm solutionId={solution._id} onSubmitted={() => onRefresh()} />}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 3: Create SolutionList**

```tsx
// src/components/solutions/SolutionList.tsx
'use client';

import { useTranslations } from 'next-intl';
import SolutionCard from './SolutionCard';
import type { SolutionDTO } from '@/types';

interface Props {
  solutions: SolutionDTO[];
  onRefresh: () => void;
}

export default function SolutionList({ solutions, onRefresh }: Props) {
  const t = useTranslations('exercises.detail');

  if (solutions.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">{t('noSolutions')}</p>;
  }

  return (
    <div className="space-y-4">
      {solutions.map((solution) => (
        <SolutionCard key={solution._id} solution={solution} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
```

> **Note:** SolutionCard depends on `CommentList`, `CommentForm`, and `DeleteButton` from Phase 5 and Phase 7. Create minimal stubs if building this task before those.

- [ ] **Step 4: Commit**

```bash
git add src/components/solutions/
git commit -m "feat: add SolutionCard, SolutionList, and LikeButton components"
```

---

### Task 22: Build solution form

**Files:**
- Create: `src/components/solutions/SolutionForm.tsx`

- [ ] **Step 1: Create SolutionForm**

```tsx
// src/components/solutions/SolutionForm.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface Props {
  exerciseId: string;
  onSubmitted: () => void;
}

export default function SolutionForm({ exerciseId, onSubmitted }: Props) {
  const t = useTranslations('solutions');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.urls) setImages((prev) => [...prev, ...data.urls]);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;

    try {
      const res = await fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, content, images }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tCommon('error'));
        return;
      }
      onSubmitted();
    } catch {
      setError(tCommon('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <Label>{t('fields.content')}</Label>
            <Textarea name="content" rows={5} placeholder={t('placeholder')} required />
          </div>
          <div className="space-y-2">
            <Label>{t('fields.images')}</Label>
            <Input type="file" accept="image/*" multiple onChange={handleFileUpload} />
            {uploading && <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-16 rounded border" />
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || uploading}>
            {loading ? tCommon('loading') : t('submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/solutions/SolutionForm.tsx
git commit -m "feat: add SolutionForm with image upload"
```

---

## Phase 5: Comments (US11)

### Task 23: Create comment API routes

**Files:**
- Create: `src/app/api/solutions/[id]/comments/route.ts`
- Create: `src/app/api/comments/[id]/route.ts`

- [ ] **Step 1: Create comments list + create route**

```typescript
// src/app/api/solutions/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: solutionId } = await params;
    await connectToDatabase();

    const comments = await Comment.find({ solutionId })
      .populate('authorId', 'name role isVerifiedTeacher')
      .sort({ createdAt: 1 })
      .lean();

    const data = comments.map((c) => ({
      ...c,
      author: c.authorId,
      authorId: undefined,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: solutionId } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    await connectToDatabase();
    const comment = await Comment.create({
      solutionId,
      authorId: session.userId,
      content: content.trim(),
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create comment delete route**

```typescript
// src/app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const comment = await Comment.findById(id);
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (comment.authorId.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Comment.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/solutions/\[id\]/comments/ src/app/api/comments/
git commit -m "feat: add comment API routes (list, create, delete)"
```

---

### Task 24: Build comment components

**Files:**
- Create: `src/components/comments/CommentList.tsx`
- Create: `src/components/comments/CommentForm.tsx`

- [ ] **Step 1: Create CommentList**

```tsx
// src/components/comments/CommentList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CommentDTO } from '@/types';

interface Props {
  solutionId: string;
}

export default function CommentList({ solutionId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchComments() {
    const res = await fetch(`/api/solutions/${solutionId}/comments`);
    const data = await res.json();
    setComments(data.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchComments();
  }, [solutionId]);

  async function handleDelete(commentId: string) {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    fetchComments();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (comments.length === 0) return null;

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment._id} className="rounded-md bg-muted/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author?.name}</span>
            {comment.author?.isVerifiedTeacher && (
              <Badge variant="secondary" className="text-xs">Teacher</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
            {user && (user._id === comment.author?._id || user.role === 'admin') && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-xs text-destructive"
                onClick={() => handleDelete(comment._id)}
              >
                Delete
              </Button>
            )}
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create CommentForm**

```tsx
// src/components/comments/CommentForm.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  solutionId: string;
  onSubmitted: () => void;
}

export default function CommentForm({ solutionId, onSubmitted }: Props) {
  const t = useTranslations('solutions');
  const tCommon = useTranslations('common');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    await fetch(`/api/solutions/${solutionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    setContent('');
    setLoading(false);
    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('addComment')}
        rows={2}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={loading || !content.trim()}>
        {tCommon('submit')}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/comments/
git commit -m "feat: add CommentList and CommentForm components"
```

---

## Phase 6: User Profile & Reputation (US3, US14, US15)

### Task 25: Create user profile API route

**Files:**
- Create: `src/app/api/users/[id]/route.ts`

- [ ] **Step 1: Create the user profile endpoint**

```typescript
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const user = await User.findById(id).select('-passwordHash').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [exerciseCount, solutionCount] = await Promise.all([
      Exercise.countDocuments({ authorId: id }),
      Solution.countDocuments({ authorId: id }),
    ]);

    return NextResponse.json({
      user: { ...user, exerciseCount, solutionCount },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/users/
git commit -m "feat: add user profile API route"
```

---

### Task 26: Build profile components

**Files:**
- Create: `src/components/profile/ProfileCard.tsx`
- Create: `src/components/profile/ReputationBadge.tsx`

- [ ] **Step 1: Create ReputationBadge**

```tsx
// src/components/profile/ReputationBadge.tsx
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

function getBadgeLevel(points: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (points >= 100) return 'expert';
  if (points >= 50) return 'advanced';
  if (points >= 20) return 'intermediate';
  return 'beginner';
}

const badgeColors = {
  beginner: 'bg-slate-100 text-slate-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-purple-100 text-purple-800',
  expert: 'bg-amber-100 text-amber-800',
};

export default function ReputationBadge({ points }: { points: number }) {
  const t = useTranslations('reputation.badges');
  const level = getBadgeLevel(points);

  return (
    <Badge className={badgeColors[level]} variant="outline">
      {t(level)}
    </Badge>
  );
}
```

- [ ] **Step 2: Create ProfileCard**

```tsx
// src/components/profile/ProfileCard.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ReputationBadge from './ReputationBadge';
import type { UserDTO } from '@/types';

interface Props {
  user: UserDTO & { exerciseCount?: number; solutionCount?: number };
}

export default function ProfileCard({ user }: Props) {
  const t = useTranslations('profile');
  const tRoles = useTranslations('roles');

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>{user.name}</span>
          {user.isVerifiedTeacher && (
            <Badge variant="default">{t('verifiedTeacher')}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('role')}</span>
            <p className="font-medium">{tRoles(user.role)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('points')}</span>
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.points}</p>
              <ReputationBadge points={user.points} />
            </div>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('exercises')}</span>
            <p className="font-medium">{user.exerciseCount ?? 0}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('solutions')}</span>
            <p className="font-medium">{user.solutionCount ?? 0}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {t('joinedAt')} {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/
git commit -m "feat: add ProfileCard and ReputationBadge components"
```

---

### Task 27: Build profile pages

**Files:**
- Modify: `src/app/[locale]/profile/page.tsx`
- Create: `src/app/[locale]/profile/[userId]/page.tsx`

- [ ] **Step 1: Rewrite the current user profile page**

```tsx
// src/app/[locale]/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import ProfileCard from '@/components/profile/ProfileCard';
import type { UserDTO } from '@/types';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<(UserDTO & { exerciseCount: number; solutionCount: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?._id) return;
    fetch(`/api/users/${authUser._id}`)
      .then((r) => r.json())
      .then((data) => { setProfile(data.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authUser?._id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">{tCommon('loading')}</div>;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">Not found</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      <ProfileCard user={profile} />
    </div>
  );
}
```

- [ ] **Step 2: Create public user profile page**

```tsx
// src/app/[locale]/profile/[userId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ProfileCard from '@/components/profile/ProfileCard';
import type { UserDTO } from '@/types';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const tCommon = useTranslations('common');
  const [profile, setProfile] = useState<(UserDTO & { exerciseCount: number; solutionCount: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((data) => { setProfile(data.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">{tCommon('loading')}</div>;
  if (!profile) return <div className="p-8 text-center">Not found</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <ProfileCard user={profile} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\[locale\]/profile/
git commit -m "feat: build profile pages (current user + public)"
```

---

## Phase 7: Moderation & Admin (US4, US12, US13)

### Task 28: Create admin API routes

**Files:**
- Create: `src/app/api/admin/stats/route.ts`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/verify-teacher/route.ts`
- Create: `src/app/api/admin/reports/route.ts`

- [ ] **Step 1: Create admin stats route**

```typescript
// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import Solution from '@/models/Solution';
import Report from '@/models/Report';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToDatabase();

  const [totalUsers, totalExercises, totalSolutions, pendingReports] = await Promise.all([
    User.countDocuments(),
    Exercise.countDocuments(),
    Solution.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
  ]);

  return NextResponse.json({ totalUsers, totalExercises, totalSolutions, pendingReports });
}
```

- [ ] **Step 2: Create admin users list route**

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToDatabase();
  const users = await User.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users });
}
```

- [ ] **Step 3: Create verify-teacher route**

```typescript
// src/app/api/admin/verify-teacher/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, verify } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await connectToDatabase();
  await User.findByIdAndUpdate(userId, {
    role: verify ? 'teacher' : 'student',
    isVerifiedTeacher: !!verify,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create reports route**

```typescript
// src/app/api/admin/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import Report from '@/models/Report';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToDatabase();
  const reports = await Report.find()
    .populate('reportedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const data = reports.map((r) => ({
    ...r,
    reportedBy: r.reportedBy,
  }));

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetType, targetId, reason } = await request.json();
  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  await connectToDatabase();
  const report = await Report.create({
    reportedBy: session.userId,
    targetType,
    targetId,
    reason,
  });

  return NextResponse.json({ report }, { status: 201 });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: add admin API routes (stats, users, verify-teacher, reports)"
```

---

### Task 29: Build admin components

**Files:**
- Create: `src/components/admin/StatsCards.tsx`
- Create: `src/components/admin/UserTable.tsx`
- Create: `src/components/admin/ReportTable.tsx`
- Create: `src/components/admin/DeleteButton.tsx`

- [ ] **Step 1: Create StatsCards**

```tsx
// src/components/admin/StatsCards.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  totalUsers: number;
  totalExercises: number;
  totalSolutions: number;
  pendingReports: number;
}

export default function StatsCards({ stats }: { stats: Stats }) {
  const t = useTranslations('admin');

  const items = [
    { label: t('totalUsers'), value: stats.totalUsers },
    { label: t('totalExercises'), value: stats.totalExercises },
    { label: t('solutions'), value: stats.totalSolutions },
    { label: t('pendingReports'), value: stats.pendingReports },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create UserTable**

```tsx
// src/components/admin/UserTable.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserDTO } from '@/types';

interface Props {
  users: UserDTO[];
  onVerifyTeacher: (userId: string, verify: boolean) => void;
}

export default function UserTable({ users, onVerifyTeacher }: Props) {
  const t = useTranslations('admin');
  const tRoles = useTranslations('roles');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>{t('stats')}</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user._id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {tRoles(user.role)}
              </Badge>
              {user.isVerifiedTeacher && (
                <Badge variant="default" className="ml-1">Verified</Badge>
              )}
            </TableCell>
            <TableCell>{user.points}</TableCell>
            <TableCell>
              {user.role !== 'admin' && (
                user.isVerifiedTeacher ? (
                  <Button variant="outline" size="sm" onClick={() => onVerifyTeacher(user._id, false)}>
                    {t('revokeTeacher')}
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={() => onVerifyTeacher(user._id, true)}>
                    {t('verifyTeacher')}
                  </Button>
                )
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: Create ReportTable**

```tsx
// src/components/admin/ReportTable.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReportDTO } from '@/types';

export default function ReportTable({ reports }: { reports: ReportDTO[] }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-slate-100 text-slate-800',
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reporter</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report._id}>
            <TableCell>{report.reportedBy?.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{report.targetType}</Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
            <TableCell>
              <Badge className={statusColors[report.status]} variant="outline">
                {report.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">
              {new Date(report.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Create DeleteButton**

```tsx
// src/components/admin/DeleteButton.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  endpoint: string;
  onDeleted: () => void;
}

export default function DeleteButton({ endpoint, onDeleted }: Props) {
  const t = useTranslations('moderation');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(endpoint, { method: 'DELETE' });
    setOpen(false);
    setLoading(false);
    onDeleted();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">{t('delete')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('delete')}</DialogTitle>
          <DialogDescription>{t('confirmDelete')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{tCommon('cancel')}</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? tCommon('loading') : tCommon('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/
git commit -m "feat: add admin components (StatsCards, UserTable, ReportTable, DeleteButton)"
```

---

### Task 30: Build admin pages

**Files:**
- Modify: `src/app/[locale]/admin/page.tsx`
- Create: `src/app/[locale]/admin/users/page.tsx`
- Create: `src/app/[locale]/admin/reports/page.tsx`

- [ ] **Step 1: Rewrite admin dashboard**

```tsx
// src/app/[locale]/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import StatsCards from '@/components/admin/StatsCards';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [stats, setStats] = useState({ totalUsers: 0, totalExercises: 0, totalSolutions: 0, pendingReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">{tCommon('loading')}</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      <StatsCards stats={stats} />
      <div className="mt-8 flex gap-4">
        <Button asChild variant="outline">
          <Link href="/admin/users">{t('users')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/reports">{t('reports')}</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create admin users page**

```tsx
// src/app/[locale]/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import UserTable from '@/components/admin/UserTable';
import type { UserDTO } from '@/types';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleVerifyTeacher(userId: string, verify: boolean) {
    await fetch('/api/admin/verify-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, verify }),
    });
    fetchUsers();
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">{tCommon('loading')}</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('users')}</h1>
      <UserTable users={users} onVerifyTeacher={handleVerifyTeacher} />
    </div>
  );
}
```

- [ ] **Step 3: Create admin reports page**

```tsx
// src/app/[locale]/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReportTable from '@/components/admin/ReportTable';
import type { ReportDTO } from '@/types';

export default function AdminReportsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports')
      .then((r) => r.json())
      .then((data) => { setReports(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">{tCommon('loading')}</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('reports')}</h1>
      {reports.length === 0 ? (
        <p className="text-muted-foreground">No reports</p>
      ) : (
        <ReportTable reports={reports} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/admin/
git commit -m "feat: build admin dashboard, users, and reports pages"
```

---

## Phase 8: Landing Page & Localization (US18, US19, US20)

### Task 31: Build the landing/home page

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Rewrite the home page with a proper landing layout**

```tsx
// src/app/[locale]/page.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const t = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('welcome')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Practice BAC exercises, share solutions, and learn collaboratively.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/exercises">{tNav('exercises')}</Link>
            </Button>
            {!user && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">{tNav('register')}</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Browse Exercises</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Find exercises organized by subject, topic, and difficulty level.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Share Solutions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Post your solutions, attach images, and help fellow students.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Build Reputation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Earn points through contributions and climb the reputation ladder.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
```

> **Note:** The hero subtitle and feature card texts above are placeholder English. They need corresponding translation keys added in Task 32.

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/page.tsx
git commit -m "feat: build landing page with hero and feature cards"
```

---

### Task 32: Complete translation files

**Files:**
- Modify: `messages/en.json` (add missing keys for landing page)
- Modify: `messages/fr.json` (complete all translations)
- Modify: `messages/ar.json` (complete all translations)

- [ ] **Step 1: Add landing page keys to en.json**

Add a new top-level `"landing"` key to `messages/en.json`:

```json
"landing": {
  "subtitle": "Practice BAC exercises, share solutions, and learn collaboratively.",
  "features": {
    "browse": {
      "title": "Browse Exercises",
      "description": "Find exercises organized by subject, topic, and difficulty level."
    },
    "solutions": {
      "title": "Share Solutions",
      "description": "Post your solutions, attach images, and help fellow students."
    },
    "reputation": {
      "title": "Build Reputation",
      "description": "Earn points through contributions and climb the reputation ladder."
    }
  }
}
```

Also add these pagination keys inside `"common"`:

```json
"page": "Page",
"of": "of",
"noMore": "No more results"
```

- [ ] **Step 2: Write complete fr.json**

Write the complete `messages/fr.json` file with all translations in standard French (Algerian usage). The file structure must exactly match `en.json` — every key in `en.json` must have a corresponding French translation. Key translations:

| English | French |
|---------|--------|
| Welcome to BAC Platform | Bienvenue sur la plateforme BAC |
| Login | Connexion |
| Register | Inscription |
| Exercises | Exercices |
| Solutions | Solutions |
| Profile | Profil |
| Admin | Administration |
| Submit | Envoyer |
| Delete | Supprimer |
| Like | J'aime |
| Comment | Commentaire |
| Points | Points |
| Student | Etudiant |
| Teacher | Enseignant |
| Easy | Facile |
| Medium | Moyen |
| Hard | Difficile |

- [ ] **Step 3: Write complete ar.json**

Write the complete `messages/ar.json` file with all translations in Modern Standard Arabic (MSA). Same structure as `en.json`. Key translations:

| English | Arabic |
|---------|--------|
| Welcome to BAC Platform | مرحبًا بكم في منصة البكالوريا |
| Login | تسجيل الدخول |
| Register | إنشاء حساب |
| Exercises | التمارين |
| Solutions | الحلول |
| Profile | الملف الشخصي |
| Admin | الإدارة |
| Submit | إرسال |
| Delete | حذف |
| Like | إعجاب |
| Comment | تعليق |
| Points | النقاط |
| Student | طالب |
| Teacher | أستاذ |
| Easy | سهل |
| Medium | متوسط |
| Hard | صعب |

- [ ] **Step 4: Update the landing page to use translation keys**

Update `src/app/[locale]/page.tsx` to use `t('landing.subtitle')`, `t('landing.features.browse.title')` etc. instead of hardcoded strings.

- [ ] **Step 5: Commit**

```bash
git add messages/ src/app/\[locale\]/page.tsx
git commit -m "feat: complete all translation files (en, fr, ar) and landing page i18n"
```

---

### Task 33: Verify RTL layout and polish

**Files:**
- Modify: `src/app/globals.css` (add any RTL-specific tweaks)

- [ ] **Step 1: Test RTL layout manually**

Run: `npm run dev`

1. Navigate to `http://localhost:3000/ar` — verify:
   - Page direction is RTL
   - Navbar items are mirrored (logo on right, actions on left)
   - Cards, forms, and text align correctly
   - Language switcher works from Arabic to English and back

2. Navigate to `http://localhost:3000/fr` — verify French works.

- [ ] **Step 2: Add RTL-specific CSS if needed**

If any components don't mirror correctly, add overrides in `globals.css`:

```css
[dir="rtl"] .flex {
  /* Tailwind handles most RTL via logical properties, but add fixes here if needed */
}
```

> In practice, Tailwind CSS v4 with `dir="rtl"` on `<html>` should handle most layout mirroring automatically. Only add CSS fixes for specific issues found during testing.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "chore: verify and polish RTL layout support"
```

---

## Execution Dependency Graph

Tasks can be parallelized where there are no dependencies. Here is the dependency structure:

```
Phase 1 (Tasks 1-8): Foundation — all sequential within phase, no external deps
  ├── Task 1: Install deps
  ├── Task 2: shadcn init (after Task 1)
  ├── Task 3: Types (independent)
  ├── Task 4: Auth utility (after Task 1)
  ├── Task 5: Cloudinary utility (after Task 1)
  ├── Task 6: Report model (independent)
  ├── Task 7: Middleware (after Task 4)
  └── Task 8: Upload API (after Task 4, Task 5)

Phase 2 (Tasks 9-13): Auth — depends on Phase 1
  ├── Task 9: Auth API routes (after Task 4)
  ├── Task 10: AuthProvider (after Task 3, Task 9)
  ├── Task 11: Login form (after Task 2, Task 10)
  ├── Task 12: Register form (after Task 2, Task 10)
  └── Task 13: Navbar update (after Task 10)

Phase 3 (Tasks 14-19): Exercises — depends on Phase 2
  ├── Task 14: Exercise API (after Task 4)
  ├── Task 15: Exercise components (after Task 2, Task 3)
  ├── Task 16: Exercise filters (after Task 2)
  ├── Task 17: Exercises page (after Task 14, Task 15, Task 16)
  ├── Task 18: Exercise form (after Task 8, Task 14)
  └── Task 19: Exercise detail page (after Task 14, depends on Phase 4 components)

Phase 4 (Tasks 20-22): Solutions — depends on Phase 1
  ├── Task 20: Solution APIs (after Task 4)
  ├── Task 21: Solution components (after Task 2, Task 3)
  └── Task 22: Solution form (after Task 8, Task 20)

Phase 5 (Tasks 23-24): Comments — depends on Phase 1
  ├── Task 23: Comment APIs (after Task 4)
  └── Task 24: Comment components (after Task 2, Task 3)

Phase 6 (Tasks 25-27): Profile — depends on Phase 2
  ├── Task 25: User API (after Task 4)
  ├── Task 26: Profile components (after Task 2, Task 3)
  └── Task 27: Profile pages (after Task 25, Task 26, Task 10)

Phase 7 (Tasks 28-30): Admin — depends on Phase 1
  ├── Task 28: Admin APIs (after Task 4, Task 6)
  ├── Task 29: Admin components (after Task 2, Task 3)
  └── Task 30: Admin pages (after Task 28, Task 29, Task 10)

Phase 8 (Tasks 31-33): Landing + i18n — depends on Phase 2
  ├── Task 31: Landing page (after Task 10)
  ├── Task 32: Translations (independent)
  └── Task 33: RTL verification (after all)
```

**Parallelizable groups after Phase 1 completes:**
- Group A: Phase 3 (API tasks) + Phase 4 (API tasks) + Phase 5 (API tasks) + Phase 7 (API tasks)
- Group B: All component tasks (UI-only, no API deps)
- Group C: Page assembly tasks (depend on both APIs and components)

---

## User Story Coverage Verification

| US | Story | Covered by Tasks |
|----|-------|-----------------|
| US1 | Registration | T9, T12 |
| US2 | Login | T9, T11 |
| US3 | Profile View | T25, T26, T27 |
| US4 | Teacher Verification | T28 (verify-teacher), T29 (UserTable), T30 |
| US5 | Browse Exercises | T14 (API), T15, T16, T17 |
| US6 | View Exercise Details | T14 (GET detail), T19 |
| US7 | Post Exercise | T14 (POST), T18 |
| US8 | Submit Solution | T20 (POST), T22 |
| US9 | View Solutions | T20 (GET), T21 |
| US10 | Like Solution | T20 (like toggle), T21 (LikeButton) |
| US11 | Comment on Solution | T23, T24 |
| US12 | Delete Content | T14 (DELETE), T20 (DELETE), T23 (DELETE), T29 (DeleteButton) |
| US13 | Report User | T28 (reports API), T29 (ReportTable), T30 |
| US14 | Gain Points | T20 (points in solution POST + like toggle) |
| US15 | Display Badge | T26 (ReputationBadge), T13 (Navbar badge) |
| US16 | AI Hint | SKIPPED (per plan scope) |
| US17 | Similar Exercises | SKIPPED (per plan scope) |
| US18 | Language Switcher | Existing LocaleSwitcher + T7 (middleware) |
| US19 | RTL Layout | Existing layout + T33 (verification) |
| US20 | Translated Content | T32 |
