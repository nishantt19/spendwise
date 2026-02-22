"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
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
  if (filters.payment_method) {
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

  revalidatePath("/transactions");
  revalidatePath("/");

  return { status: "success", message: "Transaction deleted." };
}
