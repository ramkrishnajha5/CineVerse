// Test SendGrid HTTP API (not SMTP!)
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Testing SendGrid HTTP API ===');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET (length: ' + process.env.SENDGRID_API_KEY.length + ')' : 'MISSING');
console.log('SMTP_FROM:', process.env.SMTP_FROM);
console.log('');

if (!process.env.SENDGRID_API_KEY || !process.env.SMTP_FROM) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'ram03krishna@gmail.com',
  from: process.env.SMTP_FROM,
  subject: 'CineVerse OTP Test - SendGrid HTTP API',
  html: `
    <div style="font-family: system-ui; max-width: 520px; margin: 0 auto;">
      <h2>Your CineVerse verification code</h2>
      <p>Testing SendGrid HTTP API (not SMTP!).</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; background:#111827; color:#fff; padding:14px 16px; text-align:center; border-radius:8px;">
        123456
      </div>
      <p style="color:#6b7280; font-size:12px; margin-top:16px">This uses HTTPS port 443 - never blocked!</p>
    </div>
  `,
};

console.log('Sending email via SendGrid HTTP API...');
sgMail.send(msg)
  .then((response) => {
    console.log('\n✅ Email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
    console.log('\n🎉 Check inbox: ram03krishna@gmail.com');
    console.log('✅ SendGrid HTTP API is working!');
    console.log('✅ This will work on Render because it uses HTTPS (port 443), not SMTP!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Send FAILED:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
    process.exit(1);
  });
