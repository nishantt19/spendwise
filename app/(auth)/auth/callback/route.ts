import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const email = requestUrl.searchParams.get("email");

  // Handle error from Supabase
  if (error) {
    const confirmUrl = new URL("/auth/confirm", requestUrl.origin);
    confirmUrl.searchParams.set("error", error);
    if (errorDescription) {
      confirmUrl.searchParams.set("error_description", errorDescription);
    }
    if (email) {
      confirmUrl.searchParams.set("email", email);
    }
    return NextResponse.redirect(confirmUrl);
  }

  // Exchange code for session
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
    );

    if (exchangeError) {
      const confirmUrl = new URL("/auth/confirm", requestUrl.origin);
      confirmUrl.searchParams.set("error", "exchange_failed");
      confirmUrl.searchParams.set(
        "error_description",
        exchangeError.message || "Failed to verify email",
      );
      if (email) {
        confirmUrl.searchParams.set("email", email);
      }
      return NextResponse.redirect(confirmUrl);
    }

    // Success - redirect to confirm page with success indicator
    const confirmUrl = new URL("/auth/confirm", requestUrl.origin);
    confirmUrl.searchParams.set("verified", "true");
    return NextResponse.redirect(confirmUrl);
  }

  // No code or error - redirect to confirm with error
  const confirmUrl = new URL("/auth/confirm", requestUrl.origin);
  confirmUrl.searchParams.set("error", "missing_code");
  confirmUrl.searchParams.set(
    "error_description",
    "No verification code found",
  );
  return NextResponse.redirect(confirmUrl);
}
