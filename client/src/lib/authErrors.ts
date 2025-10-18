// Helper function to convert Firebase error codes to user-friendly messages
export function getAuthErrorMessage(error: any): string {
  const code = error?.code || "";
  const message = error?.message || "";

  // Sign In Errors
  if (code === "auth/user-not-found") {
    return "Account does not exist. Sign up to create an account.";
  }
  if (code === "auth/wrong-password") {
    return "Either email or password entered incorrectly. Verify it and enter the credentials.";
  }
  if (code === "auth/invalid-credential") {
    return "Either email or password entered incorrectly. Verify it and enter the credentials.";
  }
  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/user-disabled") {
    return "This account has been disabled. Please contact support.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many failed login attempts. Please try again later or reset your password.";
  }

  // Sign Up Errors
  if (code === "auth/email-already-in-use") {
    return "Account already exists with this email. Please sign in instead.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Use at least 8 characters with uppercase and a symbol.";
  }
  if (code === "auth/operation-not-allowed") {
    return "This sign-in method is not enabled. Please contact support.";
  }

  // Google Sign In Errors
  if (code === "auth/popup-closed-by-user") {
    return "Sign-in popup was closed. Please try again.";
  }
  if (code === "auth/popup-blocked") {
    return "Sign-in popup was blocked. Please allow popups for this site.";
  }
  if (code === "auth/cancelled-popup-request") {
    return "Sign-in was cancelled. Please try again.";
  }
  if (code === "auth/account-exists-with-different-credential") {
    return "Account already exists with this email. Please sign in using the method you originally used (email/password or Google).";
  }
  if (code === "auth/credential-already-in-use") {
    return "This credential is already associated with a different account.";
  }

  // Re-authentication Errors (for delete account)
  if (code === "auth/requires-recent-login") {
    return "For security, please verify your password to continue.";
  }

  // Network Errors
  if (code === "auth/network-request-failed") {
    return "Network error. Please check your internet connection and try again.";
  }

  // Custom error messages
  if (message === "PASSWORD_REQUIRED") {
    return "Password is required to delete your account.";
  }

  // Default fallback
  if (message) {
    return message;
  }

  return "Something went wrong. Please try again.";
}
