"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/schema/categories";
import type {
  Category,
  CategoryActionResult,
  CategoryFormData,
} from "@/types/categories";

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

  revalidatePath("/categories");
  return { status: "success", message: "Category deleted." };
}
