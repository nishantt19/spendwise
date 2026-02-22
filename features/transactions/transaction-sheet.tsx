"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";

import { transactionSchema, PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/schema/transactions";
import {
  createTransaction,
  softDeleteTransaction,
  updateTransaction,
} from "@/actions/transactions";
import { todayISO } from "@/lib/format";
import type { Category } from "@/types/categories";
import type {
  TransactionFormData,
  TransactionType,
  TransactionWithCategory,
} from "@/types/transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: TransactionWithCategory | null;
  defaultType?: TransactionType;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionSheet({
  open,
  onOpenChange,
  categories,
  transaction,
  defaultType = "expense",
}: TransactionSheetProps) {
  const isEditing = !!transaction;
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const prevTypeRef = useRef<TransactionType>(defaultType);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: buildDefaults(defaultType, null),
  });

  const watchedType = form.watch("type");
  const availableCategories = categories.filter((c) => c.type === watchedType);
  const isLoading = isSaving || isDeleting;

  // Reset form and confirmDelete state on open / transaction change
  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    prevTypeRef.current = transaction?.type ?? defaultType;
    form.reset(buildDefaults(transaction?.type ?? defaultType, transaction));
  }, [open, transaction, defaultType, form]);

  // When type toggle changes, reset category_id to avoid type mismatch
  useEffect(() => {
    if (prevTypeRef.current !== watchedType) {
      form.setValue("category_id", null);
      prevTypeRef.current = watchedType;
    }
  }, [watchedType, form]);

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
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            {isEditing ? "Edit transaction" : "New transaction"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the details of this transaction."
              : "Record a new income or expense."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex flex-col gap-5 px-6 py-5">
            {/* ── Type toggle ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={watchedType === "expense" ? "default" : "outline"}
                className="w-full"
                disabled={isLoading}
                onClick={() => form.setValue("type", "expense")}
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={watchedType === "income" ? "default" : "outline"}
                className="w-full"
                disabled={isLoading}
                onClick={() => form.setValue("type", "income")}
              >
                Income
              </Button>
            </div>

            {/* ── Amount ──────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={isLoading}
                  className="pl-7"
                  {...form.register("amount", { valueAsNumber: true })}
                />
              </div>
              {form.formState.errors.amount && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.amount.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Description ─────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="tx-desc">Description</FieldLabel>
              <Input
                id="tx-desc"
                placeholder="e.g. Lunch at restaurant"
                disabled={isLoading}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.description.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Category ────────────────────────────────────────────── */}
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={form.watch("category_id") ?? ""}
                onValueChange={(val) =>
                  form.setValue("category_id", val || null)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No {watchedType} categories found
                    </SelectItem>
                  ) : (
                    availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon ?? "📁"}</span>
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            {/* ── Date ────────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="tx-date">Date</FieldLabel>
              <Input
                id="tx-date"
                type="date"
                disabled={isLoading}
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.date.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Payment method ───────────────────────────────────────── */}
            <Field>
              <FieldLabel>Payment method</FieldLabel>
              <Select
                value={form.watch("payment_method")}
                onValueChange={(val) =>
                  form.setValue(
                    "payment_method",
                    val as TransactionFormData["payment_method"],
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger>
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
              {form.formState.errors.payment_method && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.payment_method.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Note ────────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="tx-note">
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
                className="resize-none"
                {...form.register("note")}
              />
              {form.formState.errors.note && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.note.message}
                </FieldDescription>
              )}
            </Field>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <SheetFooter className="mt-auto flex-col gap-2 border-t px-6 py-4">
            {/* Delete row — only in edit mode */}
            {isEditing && (
              <div className="flex w-full items-center gap-2">
                {!confirmDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                    className="w-full"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete transaction
                  </Button>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-muted-foreground">
                      Are you sure?
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
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
                className="flex-1"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                <span className="flex items-center justify-center gap-1.5">
                  {isSaving ? <Spinner /> : ""}
                  {isEditing ? "Save changes" : "Add transaction"}
                </span>
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// DefaultValues<T> makes all fields optional, so we can safely omit `amount`
// for new transactions — the number input renders blank, which is correct UX.
function buildDefaults(
  type: TransactionType,
  transaction: TransactionWithCategory | null | undefined,
) {
  if (transaction) {
    return {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category_id: transaction.category_id ?? null,
      date: transaction.date,
      payment_method: transaction.payment_method,
      note: transaction.note ?? "",
    };
  }

  return {
    type,
    // amount omitted → renders as blank number input
    description: "",
    category_id: null,
    date: todayISO(),
    payment_method: "upi" as const,
    note: "",
  };
}
