import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Always return the same response to avoid revealing whether email exists
    const successMessage =
      'If an account exists, a reset link has been sent';

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: successMessage });
    }

    // Generate reset token
    const resetTokenRaw = crypto.randomBytes(32).toString('hex');
    const resetToken = crypto
      .createHash('sha256')
      .update(resetTokenRaw)
      .digest('hex');

    // Set token and expiry (1 hour from now)
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Until an email integration ships, surface the reset link locally only.
    // Never log secrets in production — silently no-op when NODE_ENV is set.
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[Password Reset] Token for ${email}: ${resetTokenRaw}`
      );
      console.log(
        `[Password Reset] Reset link: /reset-password?token=${resetTokenRaw}`
      );
    }

    return NextResponse.json({ message: successMessage });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
