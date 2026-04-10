# BAC Platform

Collaborative BAC (Baccalaureate) exercise practice and learning platform for Algerian students.

## Features

- Browse and filter exercises by subject, topic, subtopic, and difficulty
- Post exercises and submit solutions
- Like and comment on solutions
- Reputation points and badge system
- AI-generated hints (experimental)
- Similar exercise suggestions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | Next.js server components and route handlers |
| Database | MongoDB with Mongoose |
| i18n | next-intl |

## Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English | LTR |
| `fr` | French | LTR |
| `ar` | Arabic (MSA) | RTL |

Arabic is automatically served with `dir="rtl"` on the `<html>` element.

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Installation

```bash
git clone https://github.com/<your-username>/bac-platform.git
cd bac-platform
npm install
cp .env.local.example .env.local
# Edit .env.local and fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Locale middleware redirects `/` to `/en` by default.

## Folder Structure

```text
src/
├── app/
│   └── [locale]/
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   └── register/page.tsx
│       ├── admin/page.tsx
│       ├── exercises/
│       │   ├── [id]/page.tsx
│       │   └── page.tsx
│       ├── profile/page.tsx
│       ├── layout.tsx
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── LocaleSwitcher.tsx
│   │   └── Navbar.tsx
│   └── ui/
├── i18n/
│   ├── request.ts
│   └── routing.ts
├── lib/
│   └── mongodb.ts
├── models/
│   ├── Comment.ts
│   ├── Exercise.ts
│   ├── Solution.ts
│   └── User.ts
└── proxy.ts
messages/
├── ar.json
├── en.json
└── fr.json
```

## Adding Translations

1. Add the key to `messages/en.json`.
2. Mirror the key in `messages/fr.json` and `messages/ar.json`.
3. Read it in components with `useTranslations('namespace')`.

## User Roles

| Role | Description |
|------|-------------|
| `student` | Default role for learners posting exercises and solutions |
| `teacher` | Teacher account that can be verified by admin |
| `admin` | Moderation and platform management access |

## Environment Variables

See `.env.local.example` for the full local development template.
