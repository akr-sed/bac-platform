# Backend Report — Najah

authored by Akram 07/05/2026

## How it works today

We don't really have a separate backend. The whole API lives inside the
Next.js app under `src/app/api/...`. A request comes in, goes through our
middleware, lands in a route handler, and that handler talks to MongoDB
through Mongoose and returns JSON.

Auth is a JWT stored in an HttpOnly cookie. File uploads go through
`/api/upload` and end up on Cloudinary, and we just store the URL on the
document.

So basically one Next.js process is doing pages, API, and DB access at the
same time.

## What we're using and why

- **Next.js 16** for the pages and the API. One codebase, the team already
  knows React, lets us move fast.
- **MongoDB + Mongoose** for the database. We needed schema flexibility
  early on — every week we were adding fields to `Exercise` (concepts,
  marks, hasMath, figures...) and Mongo lets us do that without migrations.
- **JWT + bcryptjs** in an HttpOnly cookie for auth. Stateless, so no Redis
  needed.
- **Zod** for input validation on most write routes.
- **next-intl** for i18n — we support Arabic (default), French, and English.
- **Cloudinary** for all file storage. The big reason is the PDF transform:
  one URL parameter (`pg_1,w_800,h_500,f_auto`) gives us page 1 of any
  uploaded PDF as a thumbnail for the exercise card. Doing that ourselves
  would mean running pdf.js or imagemagick server-side, which we didn't
  want to deal with.

## Future work

For after the demo, I'm considering:

- Adding a **queue (BullMQ on Redis) and a worker process** so async work
  (notifications, XP grants, AI calls) doesn't run inline in the request.
- Spinning up a **separate FastAPI service** for the AI features (hint
  generation, solution grading, embeddings). Python has the better ML
  ecosystem and AI traffic is bursty — it shouldn't share a process with
  the website. The Next.js API stays the system of record and enqueues
  jobs; the AI service consumes them.
- Adding **Pino for structured logs and Sentry for error tracking**, so we
  actually know what's going on in production.
- Writing a real **test suite** with Vitest. Right now it's installed but
  empty.

Not before the demo though — two weeks isn't enough to split the
architecture safely, and we don't yet have the AI workload that would
justify it. Extend after, don't replace before.
