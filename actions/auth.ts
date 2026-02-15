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

  const { error, data } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
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
  } else if (data.user?.identities?.length === 0) {
    return {
      status: "error",
      message: "User with this email already exists. Please log in instead.",
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

  const { data: existingUser } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", formData.email)
    .limit(1)
    .single();

  if (!existingUser) {
    const { error: insertError } = await supabase.from("user_profiles").insert({
      email: data.user?.email,
      name: data.user.user_metadata?.name,
    });

    if (insertError) {
      return {
        status: "error",
        message: insertError.message,
        user: null,
      };
    }
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
    message: "Password reset email sent! Please check your inbox.",
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
