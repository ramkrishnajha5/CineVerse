import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  NODE_ENV,
} = process.env as Record<string, string | undefined>;

// Detailed logging for debugging
console.log('[email] Initializing email configuration...');
console.log('[email] Environment:', NODE_ENV || 'development');
console.log('[email] SMTP_HOST:', SMTP_HOST ? '✓ Set' : '✗ Missing');
console.log('[email] SMTP_PORT:', SMTP_PORT || '✗ Missing');
console.log('[email] SMTP_USER:', SMTP_USER ? '✓ Set' : '✗ Missing');
console.log('[email] SMTP_PASS:', SMTP_PASS ? '✓ Set (length: ' + SMTP_PASS.length + ')' : '✗ Missing');
console.log('[email] SMTP_FROM:', SMTP_FROM || '✗ Missing');

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
  console.error('[email] ❌ CRITICAL: Missing SMTP environment variables!');
  console.error('[email] OTP emails will fail. Please configure SMTP settings.');
  console.error('[email] Required variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
}

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465, // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // Additional options for better compatibility and cloud hosting
  pool: true,
  maxConnections: 1,
  rateDelta: 1000,
  rateLimit: 1,
  // Longer timeout for cloud environments
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

// Verify SMTP connection on startup
mailer.verify(function (error: Error | null, success: true | undefined) {
  if (error) {
    console.error('[email] ❌ SMTP connection failed:', error.message);
    console.error('[email] Full error:', JSON.stringify(error, null, 2));
  } else {
    console.log('[email] ✓ SMTP server is ready to send emails');
  }
});

export async function sendOtpEmail(to: string, code: string) {
  console.log(`[email] Attempting to send OTP to ${to}...`);
  
  // Check if SMTP is configured before attempting to send
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const error = new Error('SMTP is not configured. Please set SMTP environment variables.');
    console.error('[email] ❌', error.message);
    throw error;
  }

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; max-width: 520px; margin: 0 auto;">
    <h2 style="margin:0 0 12px">Your CineVerse verification code</h2>
    <p style="margin:0 0 16px">Use the code below to verify your email address. This code is valid for 10 minutes.</p>
    <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; background:#111827; color:#fff; padding:14px 16px; text-align:center; border-radius:8px;">
      ${code}
    </div>
    <p style="color:#6b7280; font-size:12px; margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
  
  try {
    const info = await mailer.sendMail({
      from: SMTP_FROM,
      to,
      subject: 'Your CineVerse verification code',
      html,
    });
    console.log(`[email] ✓ Email sent successfully to ${to}`);
    console.log(`[email] Message ID: ${info.messageId}`);
    console.log(`[email] Response: ${info.response}`);
    return info;
  } catch (error: any) {
    console.error(`[email] ❌ Failed to send email to ${to}`);
    console.error('[email] Error name:', error.name);
    console.error('[email] Error message:', error.message);
    console.error('[email] Error code:', error.code);
    console.error('[email] Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}
