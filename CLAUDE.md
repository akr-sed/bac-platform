# BAC Platform — Project Guidance

Collaborative Baccalaureate exercise practice platform for Algerian students. Next.js 15 (App Router, Turbopack) + MongoDB (Mongoose) + next-intl + Tailwind v4 + shadcn/ui (`@base-ui/react`).

## Language priorities

- **Arabic (`ar`) is the primary language of the app.** It is the default locale. Root `/` redirects to `/ar`.
- `fr` (standard French as spoken in Algeria) and `en` remain supported.
- All new UI is designed and reviewed **RTL-first**. Verify Arabic rendering before LTR in every PR.
- Use logical CSS properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`). Never `ml-*` / `pr-*` etc.
- Directional icons (arrows, chevrons) need `rtl:rotate-180` or a mirrored variant.

## Typography

- Single source of truth: **IBM Plex family** loaded via `next/font/google`.
  - `IBM_Plex_Serif` → headings (`--font-serif`)
  - `IBM_Plex_Sans` → UI / body (`--font-sans`)
  - `IBM_Plex_Sans_Arabic` → Arabic script (`--font-arabic`)
- Do not introduce new fonts without updating this file.
- Old fonts (Libre Bodoni, Public Sans, Noto Naskh Arabic, Noto Sans Arabic) are deprecated; remove on sight.
- In Arabic locale, Plex Arabic is first in the font-stack and handles the whole UI.

## UX patterns

- **Exercise feed** is the primary discovery surface. Two variants sharing a single `<ExerciseCard>` component:
  - `/[locale]/dashboard` — algorithmic (engagement + subject-match boost), infinite scroll.
  - `/[locale]/exercises` — chronological + filters, same card, filter state in URL.
- **Inline card actions** are like + bookmark only. Comments require clicking through to the detail page.
- **PDF preview** on cards uses Cloudinary URL transforms (`pg_1,w_800,h_500,c_fill,f_auto,q_auto`) rendered via `next/image`. 16:10 aspect ratio, lazy-loaded.
- Avatars: always `<UserAvatar>` component, never a raw `<img>`.

## Performance guardrails

- **Codex reviews every merge for performance.** Spec Section 5 has the checklist.
- Server Components are the default. Only like/save/comment buttons are client islands — use `'use client'` at the button level, not the card.
- All Cloudinary assets go through `next/image` — no raw `<img>` tags for remote assets.
- Fixed aspect containers everywhere an image loads (CLS < 0.1).
- Feed page bundle target: < 80 KB gzipped.
- Heavy UI (hint modal, comment drawer, image lightbox) uses `dynamic()` import.

## Data conventions

- MongoDB models live in `src/models/`. New models require `{ timestamps: true }`.
- Denormalized counters (`likesCount`, `solutionCount`, `commentsCount`, `lastActivityAt`) on `Exercise` are maintained via Mongoose middleware. A backfill script runs once when a new counter is added.
- New many-to-many relationships use a **dedicated collection** (e.g. `SavedExercise`, `ExerciseLike`), not arrays on the parent document.
- Every new collection gets its indexes documented in the spec and reflected in the schema file.

## API conventions

- Routes under `src/app/api/`. Use `request.json()` for bodies, not `FormData` (existing convention — frontend uploads files via `/api/upload` first, then sends JSON).
- Auth via `auth-token` cookie → `verifyToken` in `src/lib/auth.ts`.
- Error responses are `NextResponse.json({ error }, { status })`. Never return raw strings.

## MCP tooling

- **MongoDB MCP** — connected to local `bac-test` DB. Use to seed realistic test data before perf testing and to inspect documents during debugging.
- **Playwright MCP** — use for E2E verification of feed behaviour, RTL rendering, and Lighthouse perf runs before merge.
- **Context7 MCP** — use to verify current library APIs (`next/font`, `next-intl`, `next/image`, Mongoose) before coding a module that depends on them. Training data may be stale.

## Folder layout quick-reference

```
src/app/[locale]/             → locale-aware pages
src/app/api/                  → API routes (no locale prefix)
src/components/exercises/     → exercise-specific UI (card, hint modal, lightbox)
src/components/ui/            → primitive components (shadcn + custom)
src/components/providers/     → client-side providers
src/models/                   → Mongoose schemas
src/lib/                      → cross-cutting utilities (auth, mongodb, cloudinary, utils)
src/i18n/                     → next-intl routing + navigation
src/proxy.ts                  → middleware (Next 16 convention, not middleware.ts)
messages/{ar,fr,en}.json      → translation keys (must stay in sync)
docs/superpowers/specs/       → approved design specs (gitignored but authoritative)
```

## Conventions to keep

- Add new translation keys to all three message files (`ar`, `fr`, `en`) in the same PR.
- `UserDTO` / `ExerciseDTO` / etc. in `src/types/index.ts` are the single source of truth for API response shapes — update them when API fields change.
- Confirmation dialogs for destructive actions (delete exercise, delete solution, delete comment). Never delete blindly.
- Mongoose connection logged on success/failure — do not remove.
