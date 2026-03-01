"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

import {
  transactionSchema,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from "@/schema/transactions";
import {
  createTransaction,
  softDeleteTransaction,
  updateTransaction,
} from "@/actions/transactions";
import { todayISO } from "@/lib/format";
import { CategoryIcon } from "@/lib/category-icons";
import type { Category } from "@/types/categories";
import type {
  TransactionFormData,
  TransactionWithCategory,
} from "@/types/transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: TransactionWithCategory | null;
  onSuccess?: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionSheet({
  open,
  onOpenChange,
  categories,
  transaction,
  onSuccess,
}: TransactionSheetProps) {
  const isEditing = !!transaction;
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Only show expense categories — this page is expenses-only
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: buildDefaults(null),
  });

  const watchCategory = useWatch({
    control,
    name: "category_id",
  });

  const watchDate = useWatch({
    control,
    name: "date",
  });

  const watchPaymentMethod = useWatch({
    control,
    name: "payment_method",
  });

  const isLoading = isSaving || isDeleting;

  // Reset form and confirmDelete state on open / transaction change
  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(transaction));
  }, [open, transaction, reset]);

  function onSubmit(values: TransactionFormData) {
    startSaveTransition(async () => {
      const result = isEditing
        ? await updateTransaction(transaction.id, values)
        : await createTransaction(values);

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onSuccess?.();
      onOpenChange(false);
    });
  }

  function onDelete() {
    startDeleteTransition(async () => {
      const result = await softDeleteTransaction(transaction!.id);

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onSuccess?.();
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Mobile: 95vw wide. sm+: standard max-w-md */}
      <SheetContent
        className="flex flex-col gap-0 p-0 w-[95vw] sm:max-w-md"
        side="right"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="border-b px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <SheetTitle className="text-base sm:text-lg">
            {isEditing ? "Edit expense" : "New expense"}
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            {isEditing
              ? "Update the details of this expense."
              : "Record a new expense."}
          </SheetDescription>
        </SheetHeader>

        {/* ── Scrollable body + fixed footer, wrapped in form ────────── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col min-h-0 overflow-hidden"
        >
          {/* Scrollable fields */}
          <div className="flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
            {/* ── Amount ───────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="tx-amount" className="text-xs sm:text-sm">
                Amount
              </FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={isLoading}
                  className="pl-7 text-xs sm:text-sm"
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.amount.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Description ──────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="tx-desc" className="text-xs sm:text-sm">
                Description
              </FieldLabel>
              <Input
                id="tx-desc"
                placeholder="e.g. Lunch at restaurant"
                disabled={isLoading}
                className="text-xs sm:text-sm"
                {...register("description")}
              />
              {errors.description && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.description.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Category ─────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-sm">Category</FieldLabel>
              <Select
                value={watchCategory ?? ""}
                onValueChange={(val) => setValue("category_id", val || null)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No expense categories found
                    </SelectItem>
                  ) : (
                    expenseCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <CategoryIcon name={cat.name} size={13} />
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            {/* ── Date ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-sm">Date</FieldLabel>
              <DatePicker
                value={watchDate}
                onChange={(v) => setValue("date", v, { shouldValidate: true })}
                placeholder="Pick a date"
                disabled={isLoading}
              />
              {errors.date && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.date.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Payment method ────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-sm">
                Payment method
              </FieldLabel>
              <Select
                value={watchPaymentMethod}
                onValueChange={(val) =>
                  setValue(
                    "payment_method",
                    val as TransactionFormData["payment_method"],
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.payment_method.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Note ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="tx-note" className="text-xs sm:text-sm">
                Note{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                id="tx-note"
                placeholder="Any extra details..."
                rows={3}
                disabled={isLoading}
                className="resize-none text-xs sm:text-sm"
                {...register("note")}
              />
              {errors.note && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.note.message}
                </FieldDescription>
              )}
            </Field>
          </div>

          {/* ── Footer — always visible ─────────────────────────────────── */}
          <div className="flex flex-col gap-2 border-t px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            {/* Delete row — only in edit mode */}
            {isEditing && (
              <div className="flex w-full items-center gap-2">
                {!confirmDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                    className="w-full text-xs sm:text-sm"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete expense
                  </Button>
                ) : (
                  <>
                    <span className="flex-1 text-xs text-muted-foreground">
                      Are you sure?
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      disabled={isLoading}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-xs sm:text-sm"
                      disabled={isLoading}
                      onClick={onDelete}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {isDeleting ? <Spinner /> : ""}
                        Yes, delete
                      </span>
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Save row */}
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {isSaving ? <Spinner /> : ""}
                  {isEditing ? "Save changes" : "Add expense"}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaults(
  transaction: TransactionWithCategory | null | undefined,
) {
  if (transaction) {
    return {
      type: "expense" as const,
      amount: transaction.amount,
      description: transaction.description,
      category_id: transaction.category_id ?? null,
      date: transaction.date,
      payment_method: transaction.payment_method,
      note: transaction.note ?? "",
    };
  }

  return {
    type: "expense" as const,
    // amount omitted → renders as blank number input
    description: "",
    category_id: null,
    date: todayISO(),
    payment_method: "upi" as const,
    note: "",
  };
}
