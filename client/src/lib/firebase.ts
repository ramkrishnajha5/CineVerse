import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase initialization using Vite env variables
// Ensure these are set in your .env.local (prefixed with VITE_)
const getEnv = (key: string): string | undefined => {
  const raw = (import.meta as any).env?.[key];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  // Optional: Analytics measurement ID
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID"),
} as const;

// Validate required keys to provide a clearer error than auth/invalid-api-key
const missing: string[] = [];
for (const k of [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
]) {
  if (!(firebaseConfig as any)[k]) missing.push(k);
}
if (missing.length) {
  const msg = `Firebase env misconfiguration: missing ${missing.join(", ")}.\n` +
    `Create .env.local at the project root with your VITE_FIREBASE_* values and restart the dev server.`;
  // Surface in console for easier debugging
  console.error(msg);
  throw new Error(msg);
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Optional: initialize analytics only in the browser and when supported
export let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined") {
  // Wrap in dynamic support check to avoid SSR/build issues
  analyticsIsSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  });
}
export default app;

// Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
