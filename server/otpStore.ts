type OtpRecord = {
  code: string;
  expiresAt: number; // epoch ms
  lastSentAt: number; // epoch ms
  passwordHash?: string; // not used; we avoid storing pw. kept for future if needed
};

const store = new Map<string, OtpRecord>(); // key: email

const TEN_MIN = 10 * 60 * 1000;
const RESEND_COOLDOWN = 60 * 1000; // 60s

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function canResend(email: string): { allowed: boolean; waitMs: number } {
  const rec = store.get(email);
  if (!rec) return { allowed: true, waitMs: 0 };
  const now = Date.now();
  const waitMs = Math.max(0, RESEND_COOLDOWN - (now - rec.lastSentAt));
  return { allowed: waitMs === 0, waitMs };
}

export function setOtp(email: string, code: string) {
  store.set(email, { code, expiresAt: Date.now() + TEN_MIN, lastSentAt: Date.now() });
}

export function refreshOtp(email: string, code: string) {
  const prev = store.get(email);
  store.set(email, { code, expiresAt: Date.now() + TEN_MIN, lastSentAt: Date.now(), passwordHash: prev?.passwordHash });
}

export function verifyOtp(email: string, code: string): boolean {
  const rec = store.get(email);
  if (!rec) return false;
  const now = Date.now();
  if (now > rec.expiresAt) return false;
  return rec.code === code;
}

export function clearOtp(email: string) {
  store.delete(email);
}
