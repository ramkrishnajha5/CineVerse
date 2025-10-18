import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, sendPasswordResetEmail, sendEmailVerification, deleteUser, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ensureUserDoc, deleteUserAccount } from "@/lib/firestore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  // OTP methods
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  createAccountAfterOTP: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async signInWithGoogle() {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email || "";
      await ensureUserDoc(cred.user.uid, {
        name: email || cred.user.displayName || "User",
        profilePicture: cred.user.photoURL || "",
        gender: "",
        age: "",
        country: "",
      });
    },
    async signInWithEmail(email: string, password: string) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Ensure profile doc exists for older accounts
      await ensureUserDoc(cred.user.uid, {
        name: email,
        profilePicture: cred.user.photoURL || "",
        gender: "",
        age: "",
        country: "",
      });
    },
    async signUpWithEmail(email: string, password: string) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // ensure defaults on first signup per schema
      await ensureUserDoc(cred.user.uid, {
        name: email.split("@")[0] || email,
        profilePicture: "",
        gender: "",
        age: "",
        country: "",
      });
    },
    async signOutUser() {
      await signOut(auth);
    },
    async resetPassword(email: string) {
      await sendPasswordResetEmail(auth, email);
    },
    async resendVerificationEmail() {
      if (!auth.currentUser) throw new Error("Not signed in");
      const actionCodeSettings = {
        url: `${window.location.origin}/login?mode=login&verified=1`,
        handleCodeInApp: true,
      } as const;
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
    },
    async refreshUser() {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        // force context to pick up latest user state
        setUser(auth.currentUser);
      }
    },
    async sendOTP(email: string) {
      try {
        const response = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send OTP');
        }
        
        return { success: true, message: data.message };
      } catch (error: any) {
        return { success: false, message: error.message || 'Failed to send OTP' };
      }
    },
    async verifyOTP(email: string, code: string) {
      try {
        const response = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Invalid OTP');
        }
        
        return { success: true, message: data.message };
      } catch (error: any) {
        return { success: false, message: error.message || 'OTP verification failed' };
      }
    },
    async createAccountAfterOTP(email: string, password: string) {
      // This is called AFTER OTP is verified
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document in Firestore
      await ensureUserDoc(cred.user.uid, {
        name: email.split("@")[0] || email,
        profilePicture: "",
        gender: "",
        age: "",
        country: "",
      });
    },
    async reauthenticate(password: string) {
      if (!auth.currentUser) throw new Error("Not signed in");
      const email = auth.currentUser.email;
      if (!email) throw new Error("No email found");
      
      // Check if user signed in with Google
      const isGoogleUser = auth.currentUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      
      if (isGoogleUser) {
        // Re-authenticate with Google popup
        await reauthenticateWithPopup(auth.currentUser, googleProvider);
      } else {
        // Re-authenticate with email/password
        const credential = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
    },
    async deleteAccount(password?: string) {
      if (!auth.currentUser) throw new Error("Not signed in");
      const uid = auth.currentUser.uid;
      
      // Check if user signed in with Google
      const isGoogleUser = auth.currentUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      
      try {
        // Try to delete directly first
        await deleteUserAccount(uid);
        await deleteUser(auth.currentUser);
      } catch (error: any) {
        // If requires recent login, re-authenticate and retry
        if (error.code === 'auth/requires-recent-login') {
          if (isGoogleUser) {
            // Re-authenticate with Google
            await reauthenticateWithPopup(auth.currentUser, googleProvider);
          } else {
            // Re-authenticate with password
            if (!password) {
              throw new Error('PASSWORD_REQUIRED');
            }
            const email = auth.currentUser.email;
            if (!email) throw new Error("No email found");
            const credential = EmailAuthProvider.credential(email, password);
            await reauthenticateWithCredential(auth.currentUser, credential);
          }
          // Retry deletion after re-authentication
          await deleteUserAccount(uid);
          await deleteUser(auth.currentUser);
        } else {
          throw error;
        }
      }
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
