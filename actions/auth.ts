"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import type {
  ForgotPasswordFormData,
  LoginFormData,
  ResetPasswordFormData,
  SignupFormData,
} from "@/types/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extracts the real client IP from standard proxy headers. */
async function getClientIP(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function signUp(formData: SignupFormData) {
  const ip = await getClientIP();
  const limit = rateLimit(`sign_up:${ip}`, RATE_LIMITS.SIGN_UP);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many sign-up attempts. Try again in ${limit.retryAfterSeconds} seconds.`,
      user: null,
    };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error, data } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?email=${encodeURIComponent(formData.email)}`,
      data: { name: formData.name },
    },
  });

  if (error) {
    return { status: "error", message: error.message, user: null };
  }

  if (data.user?.identities?.length === 0) {
    return {
      status: "success",
      message:
        "Please check your email for verification instructions. If you already have an account, you can log in directly.",
      user: null,
    };
  }

  auditLog({
    action: "sign_up",
    entity: "auth",
    entity_id: data.user?.id ?? "pending",
    user_id: data.user?.id ?? "pending",
  });

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: "Signup successful! Please check your email to confirm your account.",
    user: data.user,
  };
}

export async function signIn(formData: LoginFormData) {
  const ip = await getClientIP();
  const limit = rateLimit(`sign_in:${ip}`, RATE_LIMITS.SIGN_IN);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Try again in ${limit.retryAfterSeconds} seconds.`,
      user: null,
    };
  }

  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    // Log failure without leaking the email into the audit trail
    auditLog({
      action: "sign_in",
      entity: "auth",
      entity_id: "unauthenticated",
      user_id: "unauthenticated",
      details: { success: false },
    });
    return { status: "error", message: error.message, user: null };
  }

  auditLog({
    action: "sign_in",
    entity: "auth",
    entity_id: data.user.id,
    user_id: data.user.id,
    details: { success: true },
  });

  revalidatePath("/", "layout");
  return { status: "success", message: "Sign in successful!", user: data.user };
}

export async function signOut() {
  const supabase = await createClient();

  // Capture user before invalidating the session
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { status: "error", message: error.message };
  }

  if (user) {
    auditLog({
      action: "sign_out",
      entity: "auth",
      entity_id: user.id,
      user_id: user.id,
    });
  }

  revalidatePath("/", "layout");
  redirect("/auth/login");
  return { status: "success", message: "Sign out successful!" };
}

export async function getUserSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return { status: "success", user: data.user };
}

export async function forgotPassword(formData: ForgotPasswordFormData) {
  const ip = await getClientIP();
  // Key on both IP and email to prevent targeted enumeration of one address
  const limit = rateLimit(
    `forgot_pw:${ip}:${formData.email}`,
    RATE_LIMITS.FORGOT_PASSWORD,
  );
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message:
      "If an account exists with this email, you will receive password reset instructions.",
  };
}

export async function resetPassword(
  formData: ResetPasswordFormData,
  code: string,
) {
  const ip = await getClientIP();
  const limit = rateLimit(`reset_pw:${ip}`, RATE_LIMITS.RESET_PASSWORD);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();

  const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
  if (codeError) {
    return { status: "error", message: codeError.message };
  }

  const { error } = await supabase.auth.updateUser({ password: formData.password });
  if (error) {
    return { status: "error", message: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    auditLog({
      action: "password_reset",
      entity: "auth",
      entity_id: user.id,
      user_id: user.id,
    });
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Password reset successful!" };
}

export async function confirmEmail(code: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Email verified successfully!" };
}

export async function resendVerificationEmail(email: string) {
  const limit = rateLimit(`resend_verify:${email}`, RATE_LIMITS.RESEND_VERIFICATION);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?email=${encodeURIComponent(email)}`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: "Verification email sent! Please check your inbox." };
}
