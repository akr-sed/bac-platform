import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Exercise from '@/models/Exercise';

// In-memory rate limit store: Map<`userId:exerciseId`, timestamp>
const hintRateLimit = new Map<string, number>();

// Clean up old entries every 5 minutes to prevent memory leaks
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of hintRateLimit.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
      hintRateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Rate limit check
    const rateLimitKey = `${session.userId}:${id}`;
    const lastRequest = hintRateLimit.get(rateLimitKey);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_WINDOW_MS) {
      const waitSeconds = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (Date.now() - lastRequest)) / 1000
      );
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before requesting another hint for this exercise` },
        { status: 429 }
      );
    }

    const exercise = await Exercise.findById(id).lean();
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Generate a mock hint based on exercise data
    const hint = generateMockHint(
      exercise.title,
      exercise.description,
      exercise.subject,
      exercise.topic,
      exercise.difficulty
    );

    // Update rate limit timestamp
    hintRateLimit.set(rateLimitKey, Date.now());

    return NextResponse.json({
      hint,
      disclaimer: 'This is an AI-generated hint and may be inaccurate.',
      exerciseId: id,
    });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}

function generateMockHint(
  title: string,
  description: string,
  subject: string,
  topic: string,
  difficulty: string
): string {
  const difficultyGuidance: Record<string, string> = {
    easy: 'This is a foundational exercise. Start by recalling the basic definitions and formulas related to the topic.',
    medium: 'This exercise requires applying concepts you have learned. Try breaking the problem into smaller parts and solving each one step by step.',
    hard: 'This is an advanced exercise. Consider combining multiple concepts and think about edge cases. Drawing a diagram or organizing your work may help.',
  };

  const subjectHints: Record<string, string> = {
    math: 'Identify what type of mathematical operation or theorem applies here. Write down what you know and what you need to find.',
    mathematics: 'Identify what type of mathematical operation or theorem applies here. Write down what you know and what you need to find.',
    physics: 'Start by identifying the physical quantities involved and the relevant laws or equations. Check your units throughout.',
    chemistry: 'Consider the chemical properties and reactions involved. Balance any equations and check stoichiometric relationships.',
    biology: 'Think about the biological processes and systems involved. Consider cause-and-effect relationships.',
    french: 'Pay attention to the grammatical structures and vocabulary. Read the text carefully before answering.',
    english: 'Focus on comprehension and the key themes of the passage. Support your answers with evidence from the text.',
    arabic: 'Focus on the literary techniques and rhetorical devices used. Analyze the text structure carefully.',
    philosophy: 'Consider the philosophical concepts and arguments. Structure your response with a clear thesis and supporting arguments.',
    history: 'Place the events in their historical context. Consider causes, consequences, and the perspectives of different actors.',
    geography: 'Consider spatial relationships and geographic factors. Use maps and data to support your analysis.',
  };

  const subjectKey = subject.toLowerCase();
  const subjectSpecific =
    subjectHints[subjectKey] ||
    `Focus on the key concepts of ${subject} related to ${topic}. Review your course notes on this topic.`;

  const guidance = difficultyGuidance[difficulty] || difficultyGuidance.medium;

  return `Hint for "${title}":\n\n${guidance}\n\n${subjectSpecific}\n\nTopic focus: ${topic}. Review the relevant section in your textbook and try to identify the key concept being tested.`;
}
