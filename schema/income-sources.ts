import { z } from "zod";

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

  category_id: z.string().uuid("Invalid category").nullable().optional(),

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
