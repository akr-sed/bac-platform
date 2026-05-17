// src/app/api/tutor/feedback/route.ts
//
// Wave D — AI Tutor SCAFFOLD ENDPOINT.
//
// Returns a deterministic placeholder feedback envelope for a student's
// solution attempt so the UI can be wired end-to-end before the LLM is
// integrated. Replace the placeholder values with real model output later;
// the client expects the same `{ score, comments, summary }` shape.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const feedbackSchema = z.object({
  exerciseId: z.string().min(1),
  attempt: z.string().min(1),
  images: z.array(z.string()).optional(),
});

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

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    score: 0.7,
    comments: [
      { line: 1, text: 'Good identification of the relevant variables.' },
      {
        line: 2,
        text: 'Check your sign convention here — gravity is acting downward.',
      },
    ],
    summary:
      'Solid approach overall. Re-examine the sign on the gravitational term to finish the problem.',
    __placeholder: true,
  });
}
