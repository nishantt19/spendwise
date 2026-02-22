import type { z } from "zod";
import type {
  INCOME_SOURCE_TYPES,
  incomeSourceSchema,
} from "@/schema/income-sources";

export type IncomeSourceType = (typeof INCOME_SOURCE_TYPES)[number];

export type IncomeSource = {
  id: string;
  user_id: string;
  name: string;
  source_type: IncomeSourceType;
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
