"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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

import {
  recurringSchema,
  RECURRING_FREQUENCIES,
  RECURRING_FREQUENCY_LABELS,
} from "@/schema/recurring";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/schema/transactions";
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from "@/actions/recurring";
import { todayISO } from "@/lib/format";
import { CategoryIcon } from "@/lib/category-icons";
import type { Category } from "@/types/categories";
import type { RecurringFormData, RecurringWithCategory } from "@/types/recurring";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecurringSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  expense?: RecurringWithCategory | null;
  onSuccess?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RecurringSheet({
  open,
  onOpenChange,
  categories,
  expense,
  onSuccess,
}: RecurringSheetProps) {
  const isEditing = !!expense;
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const form = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: buildDefaults(null),
  });

  const isLoading = isSaving || isDeleting;
  const watchedIsActive = form.watch("is_active");

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    form.reset(buildDefaults(expense ?? null));
  }, [open, expense, form]);

  function onSubmit(values: RecurringFormData) {
    startSaveTransition(async () => {
      const result = isEditing
        ? await updateRecurringExpense(expense.id, values)
        : await createRecurringExpense(values);

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
      const result = await deleteRecurringExpense(expense!.id);

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
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            {isEditing ? "Edit recurring expense" : "New recurring expense"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the details of this recurring expense."
              : "Set up an expense that repeats on a schedule."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex flex-col gap-5 px-6 py-5">
            {/* ── Name ─────────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="re-name">Name</FieldLabel>
              <Input
                id="re-name"
                placeholder="e.g. Gym Membership, Netflix"
                disabled={isLoading}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.name.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Amount ───────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="re-amount">Amount</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="re-amount"
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

            {/* ── Frequency ────────────────────────────────────────────── */}
            <Field>
              <FieldLabel>Frequency</FieldLabel>
              <Select
                value={form.watch("frequency")}
                onValueChange={(val) =>
                  form.setValue(
                    "frequency",
                    val as RecurringFormData["frequency"],
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How often does this repeat?" />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {RECURRING_FREQUENCY_LABELS[freq]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.frequency && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.frequency.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Category ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel>
                Category{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Select
                value={form.watch("category_id") ?? ""}
                onValueChange={(val) =>
                  form.setValue("category_id", val || null)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            {/* ── Payment method ────────────────────────────────────────── */}
            <Field>
              <FieldLabel>Payment method</FieldLabel>
              <Select
                value={form.watch("payment_method")}
                onValueChange={(val) =>
                  form.setValue(
                    "payment_method",
                    val as RecurringFormData["payment_method"],
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

            {/* ── Start & End date ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Start date</FieldLabel>
                <DatePicker
                  value={form.watch("start_date") ?? ""}
                  onChange={(v) =>
                    form.setValue("start_date", v, { shouldValidate: true })
                  }
                  placeholder="Pick start date"
                  disabled={isLoading}
                />
                {form.formState.errors.start_date && (
                  <FieldDescription className="text-destructive">
                    {form.formState.errors.start_date.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel>
                  End date{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <DatePicker
                  value={form.watch("end_date") ?? ""}
                  onChange={(v) => form.setValue("end_date", v || null)}
                  placeholder="No end date"
                  disabled={isLoading}
                />
              </Field>
            </div>

            {/* ── Status ───────────────────────────────────────────────── */}
            <Field>
              <FieldLabel>Status</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={watchedIsActive ? "default" : "outline"}
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => form.setValue("is_active", true)}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  variant={!watchedIsActive ? "default" : "outline"}
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => form.setValue("is_active", false)}
                >
                  Paused
                </Button>
              </div>
              <FieldDescription>
                Paused expenses won't generate new transactions.
              </FieldDescription>
            </Field>

            {/* ── Description ──────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="re-desc">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                id="re-desc"
                placeholder="Any extra details..."
                rows={3}
                disabled={isLoading}
                className="resize-none"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.description.message}
                </FieldDescription>
              )}
            </Field>
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <SheetFooter className="mt-auto flex-col gap-2 border-t px-6 py-4">
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
                    Delete recurring expense
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
                  {isEditing ? "Save changes" : "Add recurring"}
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

function buildDefaults(expense: RecurringWithCategory | null | undefined) {
  if (expense) {
    return {
      name: expense.name,
      description: expense.description ?? "",
      category_id: expense.category_id ?? null,
      amount: expense.amount,
      frequency: expense.frequency,
      payment_method: expense.payment_method,
      start_date: expense.start_date,
      end_date: expense.end_date ?? "",
      is_active: expense.is_active,
    };
  }

  return {
    name: "",
    description: "",
    category_id: null,
    // amount omitted → renders as blank number input
    frequency: "monthly" as const,
    payment_method: "upi" as const,
    start_date: todayISO(),
    end_date: "",
    is_active: true,
  };
}
