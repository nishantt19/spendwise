import type { z } from "zod";
import type { categorySchema } from "@/schema/categories";

export type CategoryType = "expense" | "income";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string;
  type: CategoryType;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryFormData = z.infer<typeof categorySchema>;

export type CategoryActionResult = {
  status: "success" | "error";
  message: string;
  data?: Category | null;
};
