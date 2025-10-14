import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyEmail() {
  const { completeEmailLinkSignIn } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Completing email verification, please wait...");

  useEffect(() => {
    (async () => {
      try {
        const user = await completeEmailLinkSignIn();
        if (user) {
          setStatus("success");
          setMessage("Email verified and signed in successfully. Redirecting to your dashboard...");
          setTimeout(() => navigate("/dashboard"), 1200);
        } else {
          setStatus("error");
          setMessage("This link is not a valid sign-in link. Please request a new one from the Signup page.");
        }
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "Failed to complete email link sign-in. The link may be expired or already used.");
      }
    })();
  }, [completeEmailLinkSignIn, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center bg-card border rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-2">Verify Email</h1>
          <p className={`text-sm ${status === "error" ? "text-red-500" : "text-muted-foreground"}`}>{message}</p>
          {status === "error" && (
            <div className="mt-4">
              <a href="/login?mode=signup" className="px-4 py-2 inline-block rounded bg-primary text-primary-foreground">Go to Signup</a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
