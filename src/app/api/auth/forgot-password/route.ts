import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  locale: z.enum(['ar', 'fr', 'en']).optional(),
});

function resolveBaseUrl(request: NextRequest): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  if (envBase) return envBase;
  // Fall back to the request's own origin so dev/preview deployments still
  // produce a working link without manual env setup.
  return request.nextUrl.origin;
}

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

    const { email, locale } = result.data;

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

    const lang = locale ?? 'ar';
    const resetUrl = `${resolveBaseUrl(request)}/${lang}/reset-password?token=${resetTokenRaw}`;

    // Best-effort: dispatch via Resend when configured. Failures are swallowed
    // so we never leak whether an email exists or whether delivery succeeded.
    await sendPasswordResetEmail({ to: email, resetUrl, locale: lang });

    return NextResponse.json({ message: successMessage });
  } catch {
    return NextResponse.json(
      { error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}
