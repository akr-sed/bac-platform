/**
 * Auth-gate tests for `POST /api/exams/import`.
 *
 * Locks in REVIEW.md → Critical #1: only admin/teacher sessions may reach
 * the create path. `connectToDatabase`, `getSession`, and the Mongoose
 * models are mocked — these tests stay pure-unit.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/mongodb', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/models/Exam', () => ({
  default: {
    create: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock('@/models/Exercise', () => ({
  default: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

import { getSession } from '@/lib/auth';
import Exam from '@/models/Exam';
import Exercise from '@/models/Exercise';
import { POST } from '../route';

const validPayload = {
  exam_id: 'bac-2099-math',
  exercises: [
    {
      id: 'ex-1',
      exam_id: 'bac-2099-math',
      number: 1,
      title: null,
      statement: 'بواقي القسمة الإقليدية للعدد 7',
      topic: 'arithmetique',
      concepts: [],
      difficulty: 'medium',
      marks: 4,
      has_figure: false,
      source_page: 1,
      parts: [],
      tags: [],
      metadata: {},
      solution: null,
    },
  ],
  figures: [],
  title: 'BAC 2099 — math',
  year: 2099,
  subject: 'math',
  level: '3AS',
};

function buildRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/exams/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const examMock = {
  _id: 'exam-id',
  title: 'BAC 2099 — math',
  year: 2099,
  subject: 'math',
  level: '3AS',
  source: { filename: '', parsedExamId: 'bac-2099-math' },
  exerciseIds: [] as unknown[],
  importedBy: 'admin-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  save: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
  examMock.save = vi.fn().mockResolvedValue(undefined);
});

describe('POST /api/exams/import — auth gate', () => {
  it('returns 401 when the request has no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await POST(buildRequest(validPayload));

    expect(res.status).toBe(401);
    expect(Exam.create).not.toHaveBeenCalled();
    expect(Exercise.create).not.toHaveBeenCalled();
  });

  it('returns 403 when the session role is `student`', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'u1',
      email: 's@x.com',
      role: 'student',
      name: 'Student',
    });

    const res = await POST(buildRequest(validPayload));

    expect(res.status).toBe(403);
    expect(Exam.create).not.toHaveBeenCalled();
    expect(Exercise.create).not.toHaveBeenCalled();
  });

  it('allows admin sessions through to the create path', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-id',
      email: 'a@x.com',
      role: 'admin',
      name: 'Admin',
    });
    vi.mocked(Exam.create).mockResolvedValue(examMock as never);
    vi.mocked(Exercise.create).mockResolvedValue({ _id: 'exercise-id' } as never);

    const res = await POST(buildRequest(validPayload));

    expect(res.status).toBe(201);
    expect(Exam.create).toHaveBeenCalledTimes(1);
    expect(Exercise.create).toHaveBeenCalledTimes(1);
  });

  it('allows teacher sessions through to the create path', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'teacher-id',
      email: 't@x.com',
      role: 'teacher',
      name: 'Teacher',
    });
    vi.mocked(Exam.create).mockResolvedValue(examMock as never);
    vi.mocked(Exercise.create).mockResolvedValue({ _id: 'exercise-id' } as never);

    const res = await POST(buildRequest(validPayload));

    expect(res.status).toBe(201);
  });
});

describe('POST /api/exams/import — topic-slug storage', () => {
  it('persists the topic slug verbatim instead of the resolved Arabic label', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-id',
      email: 'a@x.com',
      role: 'admin',
      name: 'Admin',
    });
    vi.mocked(Exam.create).mockResolvedValue(examMock as never);
    vi.mocked(Exercise.create).mockResolvedValue({ _id: 'exercise-id' } as never);

    const res = await POST(buildRequest(validPayload));

    expect(res.status).toBe(201);
    expect(Exercise.create).toHaveBeenCalledTimes(1);
    const created = vi.mocked(Exercise.create).mock.calls[0][0] as {
      topic: string;
    };
    // The slug, not the Arabic label "الحسابيات". Render layer resolves
    // per-locale via topicLabel(slug, locale).
    expect(created.topic).toBe('arithmetique');
  });

  it('does not embed Arabic in the default title', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-id',
      email: 'a@x.com',
      role: 'admin',
      name: 'Admin',
    });
    vi.mocked(Exam.create).mockResolvedValue(examMock as never);
    vi.mocked(Exercise.create).mockResolvedValue({ _id: 'exercise-id' } as never);

    await POST(buildRequest(validPayload));

    const created = vi.mocked(Exercise.create).mock.calls[0][0] as {
      title: string;
    };
    // No Arabic characters: locale-agnostic default so French/English
    // viewers don't get "التمرين 1 — الحسابيات".
    expect(created.title).not.toMatch(/[؀-ۿ]/);
  });
});

describe('POST /api/exams/import — hasMath detection', () => {
  it('does not flip hasMath for a lone dollar sign like "$5"', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-id',
      email: 'a@x.com',
      role: 'admin',
      name: 'Admin',
    });
    vi.mocked(Exam.create).mockResolvedValue(examMock as never);
    vi.mocked(Exercise.create).mockResolvedValue({ _id: 'exercise-id' } as never);

    const payload = {
      ...validPayload,
      exam_id: 'bac-2099-math-2',
      exercises: [
        {
          ...validPayload.exercises[0],
          statement: 'the price was $5 in 2020',
        },
      ],
    };

    await POST(buildRequest(payload));
    const created = vi.mocked(Exercise.create).mock.calls[0][0] as {
      hasMath: boolean;
    };
    expect(created.hasMath).toBe(false);
  });

  it('flips hasMath when a real `$x$` math segment is present', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-id',
      email: 'a@x.com',
      role: 'admin',
      name: 'Admin',
    });
    vi.mocked(Exam.create).mockResolvedValue(examMock as never);
    vi.mocked(Exercise.create).mockResolvedValue({ _id: 'exercise-id' } as never);

    const payload = {
      ...validPayload,
      exam_id: 'bac-2099-math-3',
      exercises: [
        {
          ...validPayload.exercises[0],
          statement: 'compute $x^2 + 1$ for x in N',
        },
      ],
    };

    await POST(buildRequest(payload));
    const created = vi.mocked(Exercise.create).mock.calls[0][0] as {
      hasMath: boolean;
    };
    expect(created.hasMath).toBe(true);
  });

  it('flips hasMath when a `$$...$$` block is present', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-id',
      email: 'a@x.com',
      role: 'admin',
      name: 'Admin',
    });
    vi.mocked(Exam.create).mockResolvedValue(examMock as never);
    vi.mocked(Exercise.create).mockResolvedValue({ _id: 'exercise-id' } as never);

    const payload = {
      ...validPayload,
      exam_id: 'bac-2099-math-4',
      exercises: [
        {
          ...validPayload.exercises[0],
          statement: 'see formula $$\\sum_i a_i$$ above',
        },
      ],
    };

    await POST(buildRequest(payload));
    const created = vi.mocked(Exercise.create).mock.calls[0][0] as {
      hasMath: boolean;
    };
    expect(created.hasMath).toBe(true);
  });
});

describe('POST /api/exams/import — duplicate-exam handling', () => {
  it('returns 409 when MongoDB raises a duplicate-key error on parsedExamId', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin-id',
      email: 'a@x.com',
      role: 'admin',
      name: 'Admin',
    });
    const dupErr = Object.assign(new Error('E11000 duplicate key'), {
      code: 11000,
    });
    vi.mocked(Exam.create).mockRejectedValue(dupErr as never);

    const res = await POST(buildRequest(validPayload));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already imported/i);
  });
});
