"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  ForgotPasswordFormData,
  LoginFormData,
  ResetPasswordFormData,
  SignupFormData,
} from "@/types/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signUp(formData: SignupFormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error, data } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?email=${encodeURIComponent(formData.email)}`,
      data: {
        name: formData.name,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
      user: null,
    };
  }

  if (data.user?.identities?.length === 0) {
    return {
      status: "success",
      message:
        "Please check your email for verification instructions. If you already have an account, you can log in directly.",
      user: null,
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      "Signup successful! Please check your email to confirm your account.",
    user: data.user,
  };
}

export async function signIn(formData: LoginFormData) {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
      user: null,
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: "Sign in successful!",
    user: data.user,
  };
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/auth/login");
  return {
    status: "success",
    message: "Sign out successful!",
  };
}

export async function getUserSession() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return {
    status: "success",
    user: data.user,
  };
}

export async function forgotPassword(formData: ForgotPasswordFormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
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
  const supabase = await createClient();

  const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);

  if (codeError) {
    return {
      status: "error",
      message: codeError.message,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: "Password reset successful!",
  };
}

export async function confirmEmail(code: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: "Email verified successfully!",
  };
}

export async function resendVerificationEmail(email: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?email=${encodeURIComponent(email)}`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "Verification email sent! Please check your inbox.",
  };
}
