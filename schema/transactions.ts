import { z } from "zod";

export const PAYMENT_METHODS = [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "upi",
  "wallet",
  "other",
] as const;

export const PAYMENT_METHOD_LABELS: Record<
  (typeof PAYMENT_METHODS)[number],
  string
> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  upi: "UPI",
  wallet: "Wallet",
  other: "Other",
};

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),

  // Use z.number() (not z.coerce) + valueAsNumber:true on the HTML input.
  // z.coerce infers `unknown` in Zod v4 which breaks the zodResolver type.
  amount: z
    .number({ message: "Enter a valid amount" })
    .positive("Amount must be greater than 0")
    .max(99_999_999, "Amount is too large"),

  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Must be 200 characters or less")
    .trim(),

  // Stored as UUID or null (no category selected)
  category_id: z.string().nullable().optional(),

  // "YYYY-MM-DD" from native date input
  date: z.string().min(1, "Date is required"),

  payment_method: z.enum(PAYMENT_METHODS),

  note: z
    .string()
    .max(500, "Note must be 500 characters or less")
    .trim()
    .nullable()
    .optional(),
});
