import { NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, email, message } = body as Record<string, unknown>;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }
  if (
    !message ||
    typeof message !== 'string' ||
    message.trim().length < 10 ||
    message.trim().length > 2000
  ) {
    return NextResponse.json(
      { error: 'message must be between 10 and 2000 characters' },
      { status: 400 }
    );
  }

  // TODO: wire SMTP transport (e.g. Nodemailer + SendGrid/Brevo)
  console.log('[support] contact form submission:', {
    name: name.trim(),
    email: email.trim(),
    messageLength: message.trim().length,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
