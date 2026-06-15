import { Resend } from 'resend';

const FROM_DEFAULT = 'NAJAH <noreply@najah.app>';

type Locale = 'ar' | 'fr' | 'en';

interface ResetEmailContent {
  subject: string;
  preview: string;
  intro: string;
  cta: string;
  fallback: string;
  expires: string;
  signature: string;
}

const RESET_COPY: Record<Locale, ResetEmailContent> = {
  ar: {
    subject: 'إعادة تعيين كلمة المرور — نجاح',
    preview: 'رابط آمن لإعادة تعيين كلمة المرور — صالح لمدة ساعة واحدة.',
    intro: 'استلمنا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط الزر أدناه لاختيار كلمة مرور جديدة.',
    cta: 'إعادة تعيين كلمة المرور',
    fallback: 'لم يعمل الزر؟ افتح الرابط التالي في متصفحك:',
    expires: 'سينتهي هذا الرابط خلال ساعة واحدة. إن لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة.',
    signature: 'فريق نجاح',
  },
  fr: {
    subject: 'Réinitialisation du mot de passe — NAJAH',
    preview: 'Lien sécurisé pour réinitialiser votre mot de passe — valable une heure.',
    intro: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte. Cliquez ci-dessous pour choisir un nouveau mot de passe.',
    cta: 'Réinitialiser le mot de passe',
    fallback: 'Le bouton ne fonctionne pas ? Ouvrez ce lien dans votre navigateur :',
    expires: "Ce lien expirera dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
    signature: "L'équipe NAJAH",
  },
  en: {
    subject: 'Reset your password — NAJAH',
    preview: 'Secure password reset link — valid for one hour.',
    intro: "We received a request to reset your account password. Click the button below to choose a new password.",
    cta: 'Reset password',
    fallback: "Button not working? Open this link in your browser:",
    expires: "This link expires in one hour. If you didn't request this, you can safely ignore this email.",
    signature: 'The NAJAH team',
  },
};

function renderResetHtml(opts: {
  copy: ResetEmailContent;
  resetUrl: string;
  isAr: boolean;
}): string {
  const { copy, resetUrl, isAr } = opts;
  const dir = isAr ? 'rtl' : 'ltr';
  const lang = isAr ? 'ar' : 'en';
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${copy.subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#E6F4FA;font-family:system-ui,-apple-system,sans-serif;color:#25313C;">
    <span style="display:none;color:transparent;visibility:hidden;opacity:0;height:0;width:0;font-size:0;">${copy.preview}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E6F4FA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;padding:32px;">
            <tr>
              <td style="padding-bottom:16px;">
                <div style="font-size:18px;font-weight:800;color:#003449;">NAJAH</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;font-size:15px;line-height:1.6;">
                ${copy.intro}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 0;">
                <a href="${resetUrl}" style="display:inline-block;background:#0095D1;color:#FFFFFF;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;font-size:15px;">${copy.cta}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#6D7D8B;line-height:1.6;">
                ${copy.fallback}<br />
                <a href="${resetUrl}" style="color:#1853F3;word-break:break-all;">${resetUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-size:12px;color:#6D7D8B;line-height:1.6;border-top:1px solid #BBC8D4;">
                ${copy.expires}
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:12px;color:#6D7D8B;">
                ${copy.signature}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function pickLocale(input?: string | null): Locale {
  if (input === 'ar' || input === 'fr' || input === 'en') return input;
  return 'ar';
}

export interface SendPasswordResetEmailArgs {
  to: string;
  resetUrl: string;
  locale?: string | null;
}

/**
 * Send a localized password-reset email via Resend.
 *
 * Behavior:
 *  - If RESEND_API_KEY is set, the email is dispatched via Resend.
 *  - If RESEND_API_KEY is missing, this is a no-op in production and falls
 *    back to a console.info in dev so the reset link is still discoverable
 *    locally. Never throws — failure to send must not surface as a 500 to
 *    the user (and must not leak whether the email is registered).
 */
export async function sendPasswordResetEmail(
  args: SendPasswordResetEmailArgs
): Promise<{ sent: boolean; error?: string }> {
  const { to, resetUrl } = args;
  const locale = pickLocale(args.locale);
  const copy = RESET_COPY[locale];

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[email] RESEND_API_KEY not set — would have sent reset to ${to}: ${resetUrl}`
      );
    }
    return { sent: false, error: 'RESEND_API_KEY missing' };
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM ?? FROM_DEFAULT;
    await resend.emails.send({
      from,
      to,
      subject: copy.subject,
      html: renderResetHtml({ copy, resetUrl, isAr: locale === 'ar' }),
      text: `${copy.intro}\n\n${copy.cta}: ${resetUrl}\n\n${copy.expires}\n\n${copy.signature}`,
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'unknown error',
    };
  }
}
