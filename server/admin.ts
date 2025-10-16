import 'dotenv/config';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Admin SDK using GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON
function initAdmin() {
  if (getApps().length) return getApps()[0]!;

  // Option 1: Use environment variable JSON (for Render/production)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      console.log('[Firebase Admin] Initializing with service account from environment variable');
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      return app;
    } catch (error) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    }
  }

  // Option 2: Use file path (for local development)
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath && fs.existsSync(keyPath)) {
    console.log('[Firebase Admin] Initializing with service account file:', keyPath);
    const app = initializeApp({
      credential: cert(keyPath),
    });
    return app;
  }

  // Option 3: Fallback to application default (works on GCP)
  console.log('[Firebase Admin] Initializing with application default credentials');
  const app = initializeApp({
    credential: applicationDefault(),
  });
  return app;
}

export const adminApp = initAdmin();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
