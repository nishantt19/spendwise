"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/audit";
import { categorySchema } from "@/schema/categories";
import type {
  Category,
  CategoryActionResult,
  CategoryFormData,
} from "@/types/categories";

export type CategoryStat = {
  category_id: string;
  amount: number;
  count: number;
};

export async function getCategoryStats(
  month: number,
  year: number,
): Promise<{ data: CategoryStat[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: "Unauthorized" };

  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const dateFrom = `${year}-${mm}-01`;
  const dateTo = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .eq("is_deleted", false)
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .not("category_id", "is", null);

  if (error) return { data: [], error: error.message };

  const map = new Map<string, { amount: number; count: number }>();
  for (const row of data ?? []) {
    if (!row.category_id) continue;
    const cur = map.get(row.category_id) ?? { amount: 0, count: 0 };
    map.set(row.category_id, { amount: cur.amount + row.amount, count: cur.count + 1 });
  }

  return {
    data: [...map.entries()].map(([category_id, s]) => ({ category_id, ...s })),
    error: null,
  };
}

export async function getCategories(): Promise<{
  expense: Category[];
  income: Category[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { expense: [], income: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return { expense: [], income: [], error: error.message };
  }

  const categories = (data ?? []) as Category[];

  return {
    expense: categories.filter((c) => c.type === "expense"),
    income: categories.filter((c) => c.type === "income"),
    error: null,
  };
}

export async function createCategory(
  formData: CategoryFormData,
): Promise<CategoryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = categorySchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: `A ${parsed.data.type} category named "${parsed.data.name}" already exists.`,
      };
    }
    return { status: "error", message: error.message };
  }

  auditLog({
    action: "create",
    entity: "category",
    entity_id: data.id,
    user_id: user.id,
    details: { name: data.name, type: data.type },
  });

  revalidatePath("/categories");
  return {
    status: "success",
    message: `"${data.name}" category created.`,
    data: data as Category,
  };
}

export async function updateCategory(
  id: string,
  formData: CategoryFormData,
): Promise<CategoryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  const parsed = categorySchema.safeParse(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: `A ${parsed.data.type} category named "${parsed.data.name}" already exists.`,
      };
    }
    return { status: "error", message: error.message };
  }

  auditLog({
    action: "update",
    entity: "category",
    entity_id: data.id,
    user_id: user.id,
    details: { name: data.name, type: data.type },
  });

  revalidatePath("/categories");
  return {
    status: "success",
    message: `"${data.name}" updated.`,
    data: data as Category,
  };
}

export async function deleteCategory(
  id: string,
): Promise<CategoryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Unauthorized" };

  // Block delete if active transactions reference this category
  const { count, error: countError } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id)
    .eq("user_id", user.id)
    .eq("is_deleted", false);

  if (countError) return { status: "error", message: countError.message };

  if (count && count > 0) {
    return {
      status: "error",
      message: `This category has ${count} transaction${count > 1 ? "s" : ""}. Reassign or delete them first.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", message: error.message };

  auditLog({
    action: "delete",
    entity: "category",
    entity_id: id,
    user_id: user.id,
  });

  revalidatePath("/categories");
  return { status: "success", message: "Category deleted." };
}
