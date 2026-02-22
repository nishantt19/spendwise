import { z } from "zod";
import { PAYMENT_METHODS } from "@/schema/transactions";

// Matches the recurring_frequency enum in Supabase exactly
export const RECURRING_FREQUENCIES = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export const RECURRING_FREQUENCY_LABELS: Record<
  (typeof RECURRING_FREQUENCIES)[number],
  string
> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

// Multipliers to normalize any frequency → monthly equivalent
export const RECURRING_MONTHLY_MULTIPLIERS: Record<
  (typeof RECURRING_FREQUENCIES)[number],
  number
> = {
  daily: 30,
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export const recurringSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less")
    .trim(),

  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .nullable()
    .optional(),

  category_id: z.string().nullable().optional(),

  // z.number() + valueAsNumber:true — Zod v4 coerce infers `unknown`
  amount: z
    .number({ message: "Enter a valid amount" })
    .positive("Amount must be greater than 0")
    .max(99_999_999, "Amount is too large"),

  frequency: z.enum(RECURRING_FREQUENCIES),

  payment_method: z.enum(PAYMENT_METHODS),

  // "YYYY-MM-DD" from native date input
  start_date: z.string().min(1, "Start date is required"),

  end_date: z.string().nullable().optional(),

  is_active: z.boolean(),
});
