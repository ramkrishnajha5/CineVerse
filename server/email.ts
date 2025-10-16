import sgMail from '@sendgrid/mail';

const {
  SENDGRID_API_KEY,
  SMTP_FROM,
  NODE_ENV,
} = process.env as Record<string, string | undefined>;

// Detailed logging for debugging
console.log('[email] Initializing SendGrid HTTP API...');
console.log('[email] Environment:', NODE_ENV || 'development');
console.log('[email] SENDGRID_API_KEY:', SENDGRID_API_KEY ? '✓ Set (length: ' + SENDGRID_API_KEY.length + ')' : '✗ Missing');
console.log('[email] SMTP_FROM:', SMTP_FROM || '✗ Missing');

if (!SENDGRID_API_KEY || !SMTP_FROM) {
  console.warn('[email] ⚠️  WARNING: SendGrid credentials incomplete. Email functionality may be limited.');
} else {
  // Initialize SendGrid with API key
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[email] ✓ SendGrid HTTP API initialized successfully');
}

export async function sendOtpEmail(to: string, code: string) {
  console.log(`[email] Attempting to send OTP to ${to} via SendGrid HTTP API...`);
  
  // Check if SendGrid is configured
  if (!SENDGRID_API_KEY || !SMTP_FROM) {
    console.error('[email] SendGrid not configured - cannot send email');
    throw new Error('Email service is not configured');
  }

  const msg = {
    to,
    from: SMTP_FROM,
    subject: 'Your CineVerse verification code',
    html: `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="margin:0 0 12px">Your CineVerse verification code</h2>
      <p style="margin:0 0 16px">Enter this code to complete your signup. This code expires in 10 minutes.</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; background:#111827; color:#fff; padding:14px 16px; text-align:center; border-radius:8px;">
        ${code}
      </div>
      <p style="color:#6b7280; font-size:12px; margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  };
  
  try {
    const response = await sgMail.send(msg);
    console.log(`[email] ✓ Email sent successfully to ${to}`);
    console.log(`[email] SendGrid Response Status: ${response[0].statusCode}`);
    return response;
  } catch (error: any) {
    console.error(`[email] ❌ Failed to send email to ${to}`);
    console.error('[email] Error:', error.message);
    if (error.response) {
      console.error('[email] SendGrid Error Response:', error.response.body);
    }
    throw error;
  }
}
