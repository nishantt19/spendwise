import { z } from "zod";

// Matches the income_source_type enum in Supabase exactly
export const INCOME_SOURCE_TYPES = [
  "salary",
  "freelance",
  "business",
  "investment",
  "rental",
  "gift",
  "credit_card",
  "other",
] as const;

export const INCOME_SOURCE_TYPE_LABELS: Record<
  (typeof INCOME_SOURCE_TYPES)[number],
  string
> = {
  salary: "Salary",
  freelance: "Freelance",
  business: "Business",
  investment: "Investment",
  rental: "Rental",
  gift: "Gift",
  credit_card: "Credit Card",
  other: "Other",
};

// Color accent per source type (hex)
export const INCOME_SOURCE_TYPE_COLORS: Record<
  (typeof INCOME_SOURCE_TYPES)[number],
  string
> = {
  salary: "#3b82f6",
  freelance: "#8b5cf6",
  business: "#f97316",
  investment: "#10b981",
  rental: "#14b8a6",
  gift: "#ec4899",
  credit_card: "#f59e0b",
  other: "#6b7280",
};

export const MONTH_LABELS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
] as const;

export const incomeSourceSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),

  source_type: z.enum(INCOME_SOURCE_TYPES),

  // z.number() + valueAsNumber:true — Zod v4 coerce infers `unknown`
  amount: z
    .number({ message: "Enter a valid amount" })
    .positive("Amount must be greater than 0")
    .max(99_999_999, "Amount is too large"),

  month: z.number().int().min(1).max(12),

  year: z.number().int().min(2000).max(2100),

  is_received: z.boolean(),

  note: z
    .string()
    .max(500, "Note must be 500 characters or less")
    .trim()
    .nullable()
    .optional(),
});
