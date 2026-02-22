"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { incomeSourceSchema } from "@/schema/income-sources";
import type {
  IncomeSource,
  IncomeSourceActionResult,
  IncomeSourceFormData,
} from "@/types/income-sources";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getIncomeSources(
  month: number,
  year: number,
): Promise<{ data: IncomeSource[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: "Unauthorized" };

  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as IncomeSource[], error: null };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createIncomeSource(
  formData: IncomeSourceFormData,
): Promise<IncomeSourceActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = incomeSourceSchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { note, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("income_sources")
    .insert({ ...rest, note: note || null, user_id: user.id })
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  revalidatePath("/income");
  revalidatePath("/");
  return {
    status: "success",
    message: `"${data.name}" added.`,
    data: data as IncomeSource,
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateIncomeSource(
  id: string,
  formData: IncomeSourceFormData,
): Promise<IncomeSourceActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = incomeSourceSchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { note, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("income_sources")
    .update({ ...rest, note: note || null })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  revalidatePath("/income");
  revalidatePath("/");
  return {
    status: "success",
    message: `"${data.name}" updated.`,
    data: data as IncomeSource,
  };
}

// ─── Toggle received ──────────────────────────────────────────────────────────

export async function toggleIncomeReceived(
  id: string,
  isReceived: boolean,
): Promise<IncomeSourceActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const { data, error } = await supabase
    .from("income_sources")
    .update({ is_received: isReceived })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  revalidatePath("/income");
  revalidatePath("/");
  return {
    status: "success",
    message: isReceived ? "Marked as received." : "Marked as pending.",
    data: data as IncomeSource,
  };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteIncomeSource(
  id: string,
): Promise<IncomeSourceActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const { error } = await supabase
    .from("income_sources")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/income");
  revalidatePath("/");
  return { status: "success", message: "Income source deleted." };
}
