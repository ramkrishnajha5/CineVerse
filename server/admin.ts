import 'dotenv/config';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Admin SDK using GOOGLE_APPLICATION_CREDENTIALS
function initAdmin() {
  if (getApps().length) return getApps()[0]!;

  // Prefer GOOGLE_APPLICATION_CREDENTIALS path when present
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath && fs.existsSync(keyPath)) {
    const app = initializeApp({
      credential: cert(keyPath),
    });
    return app;
  }

  // Fallback to application default (works on GCP)
  const app = initializeApp({
    credential: applicationDefault(),
  });
  return app;
}

export const adminApp = initAdmin();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
