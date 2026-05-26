import type { z } from "zod";
import type { incomeSourceSchema } from "@/schema/income-sources";

export type IncomeSource = {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  amount: number;
  month: number; // 1–12
  year: number;  // e.g. 2026
  note: string | null;
  is_received: boolean;
  received_at: string | null; // ISO timestamptz, set by DB trigger
  created_at: string;
  updated_at: string;
};

export type IncomeSourceFormData = z.infer<typeof incomeSourceSchema>;

export type IncomeSourceActionResult = {
  status: "success" | "error";
  message: string;
  data?: IncomeSource | null;
};
