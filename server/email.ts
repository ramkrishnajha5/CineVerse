// Brevo Email Service (formerly Sendinblue)
// Uses HTTP API - works on Render free tier (HTTPS port 443 is not blocked)

const {
  BREVO_API_KEY,
  SMTP_FROM,
  SMTP_FROM_NAME,
  NODE_ENV,
} = process.env as Record<string, string | undefined>;

// Detailed logging for debugging
console.log('[email] Initializing Brevo HTTP API...');
console.log('[email] Environment:', NODE_ENV || 'development');
console.log('[email] BREVO_API_KEY:', BREVO_API_KEY ? '✓ Set (length: ' + BREVO_API_KEY.length + ')' : '✗ Missing');
console.log('[email] SMTP_FROM:', SMTP_FROM || '✗ Missing');
console.log('[email] SMTP_FROM_NAME:', SMTP_FROM_NAME || 'CINEVERSE (default)');

if (!BREVO_API_KEY || !SMTP_FROM) {
  console.warn('[email] ⚠️  WARNING: Brevo credentials incomplete. Email functionality may be limited.');
} else {
  console.log('[email] ✓ Brevo HTTP API ready');
}

export async function sendOtpEmail(to: string, code: string) {
  console.log(`[email] Attempting to send OTP to ${to} via Brevo HTTP API...`);

  // Check if Brevo is configured
  if (!BREVO_API_KEY || !SMTP_FROM) {
    console.error('[email] Brevo not configured - cannot send email');
    throw new Error('Email service is not configured');
  }

  const senderName = SMTP_FROM_NAME || 'CINEVERSE';

  const emailData = {
    sender: {
      name: senderName,
      email: SMTP_FROM
    },
    to: [
      {
        email: to,
        name: to.split('@')[0] // Use email prefix as name
      }
    ],
    subject: 'Your CineVerse verification code',
    htmlContent: `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="margin:0 0 12px">Your CineVerse verification code</h2>
      <p style="margin:0 0 16px">Enter this code to complete your signup. This code expires in 10 minutes.</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; background:#111827; color:#fff; padding:14px 16px; text-align:center; border-radius:8px;">
        ${code}
      </div>
      <p style="color:#6b7280; font-size:12px; margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`[email] ✓ Email sent successfully to ${to}`);
      console.log(`[email] Brevo Message ID: ${result.messageId}`);
      return result;
    } else {
      console.error(`[email] ❌ Failed to send email to ${to}`);
      console.error('[email] Brevo Error:', JSON.stringify(result));
      throw new Error(result.message || 'Failed to send email via Brevo');
    }
  } catch (error: any) {
    console.error(`[email] ❌ Failed to send email to ${to}`);
    console.error('[email] Error:', error.message);
    throw error;
  }
}
