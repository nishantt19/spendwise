"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recurringSchema } from "@/schema/recurring";
import type {
  RecurringActionResult,
  RecurringExpense,
  RecurringFormData,
  RecurringWithCategory,
} from "@/types/recurring";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getRecurringExpenses(): Promise<{
  data: RecurringWithCategory[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: "Unauthorized" };

  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*, category:categories(id, name, icon, color, type)")
    .eq("user_id", user.id)
    // Active first, then by next due date ascending (soonest first)
    .order("is_active", { ascending: false })
    .order("next_due_date", { ascending: true });

  if (error) return { data: [], error: error.message };

  return { data: (data ?? []) as RecurringWithCategory[], error: null };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRecurringExpense(
  formData: RecurringFormData,
): Promise<RecurringActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = recurringSchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { description, category_id, end_date, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert({
      ...rest,
      description: description || null,
      category_id: category_id || null,
      end_date: end_date || null,
      // next_due_date starts at start_date; DB trigger advances it after each run
      next_due_date: parsed.data.start_date,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  revalidatePath("/recurring");
  revalidatePath("/");
  return {
    status: "success",
    message: `"${data.name}" added.`,
    data: data as RecurringExpense,
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateRecurringExpense(
  id: string,
  formData: RecurringFormData,
): Promise<RecurringActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = recurringSchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { description, category_id, end_date, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("recurring_expenses")
    .update({
      ...rest,
      description: description || null,
      category_id: category_id || null,
      end_date: end_date || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  revalidatePath("/recurring");
  revalidatePath("/");
  return {
    status: "success",
    message: `"${data.name}" updated.`,
    data: data as RecurringExpense,
  };
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleRecurringActive(
  id: string,
  isActive: boolean,
): Promise<RecurringActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const { data, error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  revalidatePath("/recurring");
  revalidatePath("/");
  return {
    status: "success",
    message: isActive ? "Activated." : "Paused.",
    data: data as RecurringExpense,
  };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteRecurringExpense(
  id: string,
): Promise<RecurringActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/recurring");
  revalidatePath("/");
  return { status: "success", message: "Recurring expense deleted." };
}
