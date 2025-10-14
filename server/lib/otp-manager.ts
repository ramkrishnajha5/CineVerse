import crypto from 'crypto';

interface OTPRecord {
  code: string;
  email: string;
  expires: number;
  attempts: number;
}

// In-memory OTP storage (for production, use Redis or database)
const otpStore = new Map<string, OTPRecord>();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of Array.from(otpStore.entries())) {
    if (record.expires < now) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class OTPManager {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a 6-digit OTP code
   */
  static generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create and store an OTP for an email
   * @param email User's email address
   * @returns Generated OTP code
   */
  static createOTP(email: string): string {
    const code = this.generateCode();
    const key = email.toLowerCase().trim();
    
    otpStore.set(key, {
      code,
      email: key,
      expires: Date.now() + this.OTP_EXPIRY,
      attempts: 0,
    });

    console.log(`[OTP] Generated for ${email}: ${code} (expires in 10 min)`);
    return code;
  }

  /**
   * Verify an OTP code
   * @param email User's email address
   * @param code OTP code to verify
   * @returns true if valid, false otherwise
   */
  static verifyOTP(email: string, code: string): { valid: boolean; message: string } {
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);

    if (!record) {
      return { valid: false, message: 'No OTP found. Please request a new one.' };
    }

    // Check expiry
    if (Date.now() > record.expires) {
      otpStore.delete(key);
      return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Check max attempts
    if (record.attempts >= this.MAX_ATTEMPTS) {
      otpStore.delete(key);
      return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Increment attempts
    record.attempts++;

    // Verify code
    if (record.code !== code.trim()) {
      return { valid: false, message: `Invalid OTP. ${this.MAX_ATTEMPTS - record.attempts} attempts remaining.` };
    }

    // Success - remove OTP
    otpStore.delete(key);
    console.log(`[OTP] Successfully verified for ${email}`);
    return { valid: true, message: 'OTP verified successfully!' };
  }

  /**
   * Check if OTP exists for email (for rate limiting)
   */
  static hasActiveOTP(email: string): boolean {
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);
    return record !== undefined && Date.now() < record.expires;
  }

  /**
   * Get remaining time for OTP
   */
  static getRemainingTime(email: string): number {
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);
    if (!record) return 0;
    return Math.max(0, record.expires - Date.now());
  }
}
