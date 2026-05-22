"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/audit";
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

  if (category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category_id)
      .eq("user_id", user.id)
      .single();
    if (!cat) return { status: "error", message: "Invalid category." };
  }

  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert({
      ...rest,
      description: description ?? null,
      category_id: category_id ?? null,
      end_date: end_date ?? null,
      // next_due_date starts at start_date; DB trigger advances it after each run
      next_due_date: parsed.data.start_date,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  auditLog({
    action: "create",
    entity: "recurring_expense",
    entity_id: data.id,
    user_id: user.id,
    details: { amount: data.amount, name: data.name, frequency: data.frequency },
  });

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

  if (category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category_id)
      .eq("user_id", user.id)
      .single();
    if (!cat) return { status: "error", message: "Invalid category." };
  }

  const { data, error } = await supabase
    .from("recurring_expenses")
    .update({
      ...rest,
      description: description ?? null,
      category_id: category_id ?? null,
      end_date: end_date ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  auditLog({
    action: "update",
    entity: "recurring_expense",
    entity_id: data.id,
    user_id: user.id,
    details: { amount: data.amount, name: data.name, frequency: data.frequency },
  });

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

  auditLog({
    action: "toggle",
    entity: "recurring_expense",
    entity_id: data.id,
    user_id: user.id,
    details: { is_active: isActive },
  });

  revalidatePath("/recurring");
  revalidatePath("/");
  return {
    status: "success",
    message: isActive ? "Activated." : "Paused.",
    data: data as RecurringExpense,
  };
}

// ─── Add to expense ───────────────────────────────────────────────────────────

export async function addRecurringToExpense(
  id: string,
): Promise<RecurringActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  // Fetch the recurring expense
  const { data: expense, error: fetchError } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !expense)
    return { status: "error", message: "Recurring expense not found" };

  const today = new Date().toISOString().split("T")[0];

  // Create the transaction
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: "expense",
    amount: expense.amount,
    description: expense.name,
    category_id: expense.category_id ?? null,
    date: today,
    payment_method: expense.payment_method,
    note: expense.description ?? null,
    recurring_expense_id: expense.id,
    is_deleted: false,
  });

  if (txError) return { status: "error", message: txError.message };

  // Advance next_due_date based on frequency
  const nextDate = computeNextDueDate(expense.next_due_date, expense.frequency);
  await supabase
    .from("recurring_expenses")
    .update({ next_due_date: nextDate })
    .eq("id", id)
    .eq("user_id", user.id);

  auditLog({
    action: "create",
    entity: "transaction",
    entity_id: id,
    user_id: user.id,
    details: { source: "recurring", name: expense.name, amount: expense.amount },
  });

  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return {
    status: "success",
    message: `"${expense.name}" added to expenses.`,
    data: expense as RecurringExpense,
  };
}

function computeNextDueDate(current: string, frequency: string): string {
  const date = new Date(`${current}T00:00:00`);
  switch (frequency) {
    case "daily":     date.setDate(date.getDate() + 1); break;
    case "weekly":    date.setDate(date.getDate() + 7); break;
    case "biweekly":  date.setDate(date.getDate() + 14); break;
    case "monthly":   date.setMonth(date.getMonth() + 1); break;
    case "quarterly": date.setMonth(date.getMonth() + 3); break;
    case "yearly":    date.setFullYear(date.getFullYear() + 1); break;
  }
  return date.toISOString().split("T")[0];
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

  auditLog({
    action: "delete",
    entity: "recurring_expense",
    entity_id: id,
    user_id: user.id,
  });

  revalidatePath("/recurring");
  revalidatePath("/");
  return { status: "success", message: "Recurring expense deleted." };
}
