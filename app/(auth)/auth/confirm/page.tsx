import { EmailConfirmation } from "@/components/auth/email-confirmation";
import type { AuthActionResult } from "@/types/auth";

interface ConfirmPageProps {
  searchParams: Promise<{
    verified?: string;
    error?: string;
    error_description?: string;
    email?: string;
  }>;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const { verified, error, error_description, email } = params;

  let result: AuthActionResult;

  if (verified === "true") {
    result = {
      status: "success" as const,
      message: "Email verified successfully!",
    };
  } else if (error) {
    result = {
      status: "error" as const,
      message:
        error === "access_denied" || error === "otp_expired"
          ? error_description ||
            "Verification link has expired or is invalid. Please request a new one."
          : error_description || "An error occurred during email verification.",
    };
  } else {
    result = {
      status: "error" as const,
      message:
        "Invalid verification link. Please check your email or request a new verification link.",
    };
  }

  return <EmailConfirmation result={result} userEmail={email} />;
}
