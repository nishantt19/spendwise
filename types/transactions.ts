import type { z } from "zod";
import type { transactionSchema, PAYMENT_METHODS } from "@/schema/transactions";

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type TransactionType = "income" | "expense";

export type TransactionCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  type: TransactionType;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  recurring_expense_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // "YYYY-MM-DD"
  payment_method: PaymentMethod;
  note: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type TransactionWithCategory = Transaction & {
  category: TransactionCategory | null;
};

export type TransactionFilters = {
  search?: string;
  type?: TransactionType;
  category_id?: string;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
};

export type TransactionFormData = z.infer<typeof transactionSchema>;

export type TransactionActionResult = {
  status: "success" | "error";
  message: string;
  data?: Transaction | null;
};

export type GetTransactionsResult = {
  data: TransactionWithCategory[];
  total: number;
  error: string | null;
};
