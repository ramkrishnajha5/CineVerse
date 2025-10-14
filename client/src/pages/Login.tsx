import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, loading, user, sendOTP, verifyOTP, createAccountAfterOTP } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">(() => (new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login"));
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  // OTP-related states
  const [showOTPStep, setShowOTPStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Check for verification error in URL
  const urlParams = new URLSearchParams(window.location.search);
  const verifyError = urlParams.get("error") === "verify";

  if (!loading && user && user.emailVerified) {
    // already logged in and verified
    navigate("/");
  }

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOTP = async () => {
    setError(null);
    setOtpMessage("");
    
    // Validate password before sending OTP (only on initial send, not resend)
    if (!showOTPStep) {
      const hasMinLen = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasSymbol = /[^A-Za-z0-9]/.test(password);
      if (!hasMinLen || !hasUpper || !hasSymbol) {
        setError("Password must be at least 8 characters and include 1 uppercase and 1 symbol.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }
    }
    
    setOtpSending(true);
    const result = await sendOTP(email);
    setOtpSending(false);
    
    if (result.success) {
      setShowOTPStep(true);
      setOtpSent(true);
      setOtpMessage(result.message);
      setResendCountdown(30); // Start 30-second countdown
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOTP = async () => {
    setError(null);
    setOtpMessage("");
    
    if (otpCode.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP code");
      return;
    }
    
    setOtpVerifying(true);
    const result = await verifyOTP(email, otpCode);
    
    if (result.success) {
      // OTP verified - now create Firebase account
      try {
        await createAccountAfterOTP(email, password);
        setSignupSuccess(true);
        setOtpMessage("Account created successfully!");
        setTimeout(() => navigate("/"), 2000);
      } catch (err: any) {
        const code = err?.code || "";
        let msg = err?.message || "Failed to create account";
        if (code === "auth/email-already-in-use") {
          msg = "This email is already registered. Please sign in.";
        }
        setError(msg);
      }
    } else {
      setError(result.message);
    }
    setOtpVerifying(false);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        navigate("/");
      } else {
        // For signup, trigger OTP flow
        await handleSendOTP();
      }
    } catch (err: any) {
      // Map common Firebase errors to friendly messages
      const code = err?.code || "";
      let msg = err?.message || "Something went wrong";
      if (code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please sign in or use Forgot Password.";
      } else if (code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (code === "auth/weak-password") {
        msg = "Your password is too weak. Use at least 8 chars with uppercase and a symbol.";
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password") {
        msg = "Incorrect email or password.";
      }
      setError(msg);
    }
  };

  const handleResendOTP = async () => {
    await handleSendOTP();
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 text-white p-6">
      <div className="w-full max-w-md bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 shadow-xl relative">
        {/* Cancel Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h1 className="text-2xl font-semibold mb-4 text-center pr-8">Welcome to CineVerse</h1>
        <p className="text-zinc-400 text-sm mb-6 text-center">Sign in to continue</p>

        {error && (
          <div className="mb-4 text-sm text-red-400 border border-red-500/40 bg-red-500/10 rounded p-2">{error}</div>
        )}

        {otpMessage && !error && (
          <div className="mb-4 text-sm text-green-400 border border-green-500/40 bg-green-500/10 rounded p-2">✅ {otpMessage}</div>
        )}

        {verifyError && (
          <div className="mb-4 text-sm text-yellow-400 border border-yellow-500/40 bg-yellow-500/10 rounded p-2">
            ⚠️ Please verify your email before accessing the dashboard. Check your inbox for the verification link.
          </div>
        )}

        {!showOTPStep ? (
          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={otpSending}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={otpSending}
              />
            </div>
            {mode === "signup" && (
              <div>
                <label className="block text-sm mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  disabled={otpSending}
                />
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || signupSuccess || otpSending}
            >
              {mode === "login" ? "Sign In" : otpSending ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 bg-indigo-900/30 border border-indigo-700 rounded">
              <p className="text-sm text-indigo-200 mb-2">📧 OTP sent to:</p>
              <p className="font-semibold text-white">{email}</p>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Enter 6-digit OTP</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest font-mono"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={otpVerifying || signupSuccess}
              />
              <p className="text-xs text-zinc-400 mt-2">Check your email inbox and spam folder</p>
            </div>
            
            <button
              onClick={handleVerifyOTP}
              className="w-full py-2 rounded bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={otpVerifying || signupSuccess || otpCode.length !== 6}
            >
              {otpVerifying ? "Verifying..." : signupSuccess ? "✅ Verified" : "Verify & Create Account"}
            </button>
            
            <div className="text-center">
              <button
                onClick={handleResendOTP}
                className="text-xs text-indigo-400 hover:underline disabled:text-zinc-600 disabled:cursor-not-allowed disabled:no-underline"
                disabled={otpSending || otpVerifying || signupSuccess || resendCountdown > 0}
              >
                {otpSending 
                  ? "Sending..." 
                  : resendCountdown > 0 
                    ? `Resend OTP (${resendCountdown}s)` 
                    : "Resend OTP"}
              </button>
              <span className="text-zinc-500 mx-2">•</span>
              <button
                onClick={() => {
                  setShowOTPStep(false);
                  setOtpCode("");
                  setOtpMessage("");
                  setError(null);
                  setResendCountdown(0);
                }}
                className="text-xs text-zinc-400 hover:underline"
                disabled={otpVerifying || signupSuccess}
              >
                Change Email
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && signupSuccess && (
          <div className="mt-3 p-3 text-sm bg-green-900/30 border border-green-700 rounded text-green-200">
            ✅ Account created! Redirecting...
          </div>
        )}

        {!showOTPStep && (
          <>
            {mode === "login" && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError("Enter your email to reset password");
                      return;
                    }
                    try {
                      await resetPassword(email);
                      alert("Password reset email sent");
                    } catch (e: any) {
                      setError(e?.message || "Failed to send reset email");
                    }
                  }}
                  className="text-xs text-zinc-400 hover:text-indigo-400"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <div className="my-4 flex items-center gap-2">
              <div className="h-px bg-zinc-700 flex-1" />
              <span className="text-xs text-zinc-500">OR</span>
              <div className="h-px bg-zinc-700 flex-1" />
            </div>

            <button
              onClick={handleGoogle}
              className="w-full py-2 rounded bg-white text-black hover:bg-zinc-200 transition-colors"
              disabled={loading}
            >
              Continue with Google
            </button>

            <div className="mt-4 text-center text-sm text-zinc-400">
              {mode === "login" ? (
                <span>
                  Don't have an account?{" "}
                  <button onClick={() => setMode("signup")} className="text-indigo-400 hover:underline">Sign up</button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-indigo-400 hover:underline">Sign in</button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
