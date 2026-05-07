import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'invalid' },
        { status: 400 }
      );
    }

    const { token } = result.data;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    user.emailVerifiedAt = new Date();
    user.verificationToken = undefined;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
