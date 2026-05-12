// src/app/api/tutor/hint/route.ts
//
// Wave D — AI Tutor SCAFFOLD ENDPOINT.
//
// Returns deterministic placeholder hints so the UI can be developed and
// verified end-to-end before any LLM is wired in. Real implementation will
// replace the body of POST() with a call out to the model — the response
// envelope is intentionally final-shape so the client doesn't need changes.
//
// `__placeholder: true` is included on every response so the UI/tests can
// detect this is the scaffold and not real AI output.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const hintSchema = z.object({
  exerciseId: z.string().min(1),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const PLACEHOLDER_HINTS: Record<1 | 2 | 3, string> = {
  1: "Think about which physical principle most directly applies to the unknown you're solving for.",
  2: 'Consider how the conservation laws might constrain the system at the moment of the event described.',
  3: 'Apply momentum conservation in the horizontal direction; the vertical components cancel.',
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = hintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { level } = parsed.data;

  return NextResponse.json({
    hint: PLACEHOLDER_HINTS[level],
    level,
    exhausted: level === 3,
    __placeholder: true,
  });
}
