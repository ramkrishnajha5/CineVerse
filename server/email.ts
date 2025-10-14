import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env as Record<string, string | undefined>;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
  console.warn('[email] Missing SMTP_* environment variables. OTP emails will fail.');
}

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT || 587) === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string) {
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; max-width: 520px; margin: 0 auto;">
    <h2 style="margin:0 0 12px">Your CineVerse verification code</h2>
    <p style="margin:0 0 16px">Use the code below to verify your email address. This code is valid for 10 minutes.</p>
    <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; background:#111827; color:#fff; padding:14px 16px; text-align:center; border-radius:8px;">
      ${code}
    </div>
    <p style="color:#6b7280; font-size:12px; margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
  await mailer.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Your CineVerse verification code',
    html,
  });
}
