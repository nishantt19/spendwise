"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/audit";
import { transactionSchema } from "@/schema/transactions";
import type {
  GetTransactionsResult,
  TransactionActionResult,
  TransactionFilters,
  TransactionFormData,
  TransactionWithCategory,
} from "@/types/transactions";

const PAGE_SIZE = 50;

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getTransactions(
  filters: TransactionFilters = {},
  page = 1,
): Promise<GetTransactionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], total: 0, error: "Unauthorized" };

  let query = supabase
    .from("transactions")
    .select(`*, category:categories(id, name, icon, color, type)`, {
      count: "exact",
    })
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("description", `%${filters.search}%`);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id);
  }
  if (filters.payment_methods && filters.payment_methods.length > 0) {
    query = query.in("payment_method", filters.payment_methods);
  } else if (filters.payment_method) {
    query = query.eq("payment_method", filters.payment_method);
  }
  if (filters.date_from) {
    query = query.gte("date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("date", filters.date_to);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) return { data: [], total: 0, error: error.message };

  return {
    data: (data ?? []) as TransactionWithCategory[],
    total: count ?? 0,
    error: null,
  };
}

// ─── Monthly expense total (lightweight, for delta badge) ─────────────────────

export async function getMonthlyExpenseTotal(
  month: number,
  year: number,
): Promise<{ total: number; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, error: "Unauthorized" };

  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .eq("is_deleted", false)
    .gte("date", `${year}-${mm}-01`)
    .lte("date", `${year}-${mm}-${String(lastDay).padStart(2, "0")}`);

  if (error) return { total: 0, error: error.message };
  const total = (data ?? []).reduce((s, r) => s + r.amount, 0);
  return { total, error: null };
}

// ─── Monthly income total (for daily spend baseline) ──────────────────────────

export async function getMonthlyIncomeTotal(
  month: number,
  year: number,
): Promise<{ total: number; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("income_sources")
    .select("amount")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year);

  if (error) return { total: 0, error: error.message };
  const total = (data ?? []).reduce((s, r) => s + r.amount, 0);
  return { total, error: null };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTransaction(
  formData: TransactionFormData,
): Promise<TransactionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = transactionSchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { note, category_id, ...rest } = parsed.data;

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
    .from("transactions")
    .insert({
      ...rest,
      category_id: category_id ?? null,
      note: note ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  auditLog({
    action: "create",
    entity: "transaction",
    entity_id: data.id,
    user_id: user.id,
    details: { amount: data.amount, type: data.type, date: data.date },
  });

  revalidatePath("/transactions");
  revalidatePath("/"); // invalidate dashboard too

  return {
    status: "success",
    message: "Transaction added.",
    data,
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateTransaction(
  id: string,
  formData: TransactionFormData,
): Promise<TransactionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = transactionSchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { note, category_id, ...rest } = parsed.data;

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
    .from("transactions")
    .update({
      ...rest,
      category_id: category_id ?? null,
      note: note ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { status: "error", message: error.message };

  auditLog({
    action: "update",
    entity: "transaction",
    entity_id: data.id,
    user_id: user.id,
    details: { amount: data.amount, type: data.type, date: data.date },
  });

  revalidatePath("/transactions");
  revalidatePath("/");

  return {
    status: "success",
    message: "Transaction updated.",
    data,
  };
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

export async function softDeleteTransaction(
  id: string,
): Promise<TransactionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const { error } = await supabase
    .from("transactions")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", message: error.message };

  auditLog({
    action: "soft_delete",
    entity: "transaction",
    entity_id: id,
    user_id: user.id,
  });

  revalidatePath("/transactions");
  revalidatePath("/");

  return { status: "success", message: "Transaction deleted." };
}
