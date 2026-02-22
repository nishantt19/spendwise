import type { z } from "zod";
import type { RECURRING_FREQUENCIES, recurringSchema } from "@/schema/recurring";
import type { PaymentMethod, TransactionCategory } from "@/types/transactions";

export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export type RecurringExpense = {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  description: string | null;
  frequency: RecurringFrequency;
  payment_method: PaymentMethod;
  start_date: string;  // "YYYY-MM-DD"
  end_date: string | null;
  next_due_date: string; // "YYYY-MM-DD", managed by DB trigger
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecurringWithCategory = RecurringExpense & {
  category: TransactionCategory | null;
};

export type RecurringFormData = z.infer<typeof recurringSchema>;

export type RecurringActionResult = {
  status: "success" | "error";
  message: string;
  data?: RecurringExpense | null;
};
