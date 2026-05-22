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
  SheetDescription,
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

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
import type {
  RecurringFormData,
  RecurringWithCategory,
} from "@/types/recurring";

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

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: buildDefaults(null),
  });

  const isLoading = isSaving || isDeleting;

  const watchedIsActive = useWatch({
    control,
    name: "is_active",
  });

  const watchFrequency = useWatch({
    control,
    name: "frequency",
  });

  const watchCategory = useWatch({
    control,
    name: "category_id",
  });

  const watchPaymentMethod = useWatch({
    control,
    name: "payment_method",
  });

  const watchStartDate = useWatch({
    control,
    name: "start_date",
  });

  const watchEndDate = useWatch({
    control,
    name: "end_date",
  });

  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(expense ?? null));
  }, [open, expense, reset]);

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
      {/* Mobile: 95vw wide. sm+: standard max-w-md */}
      <SheetContent
        className="flex flex-col gap-0 p-0 w-full sm:max-w-md"
        side="right"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="border-b px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <SheetTitle className="text-base sm:text-lg">
            {isEditing ? "Edit recurring expense" : "New recurring expense"}
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-13">
            {isEditing
              ? "Update the details of this recurring expense."
              : "Set up an expense that repeats on a schedule."}
          </SheetDescription>
        </SheetHeader>

        {/* ── Scrollable body + fixed footer, wrapped in form ────────── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col min-h-0 overflow-hidden"
        >
          {/* Scrollable fields */}
          <div className="flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
            {/* ── Name ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="re-name" className="text-xs sm:text-13">
                Name
              </FieldLabel>
              <Input
                id="re-name"
                placeholder="e.g. Gym Membership, Netflix"
                disabled={isLoading}
                className="text-xs sm:text-13"
                {...register("name")}
              />
              {errors.name && (
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.name.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Amount ───────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="re-amount" className="text-xs sm:text-13">
                Amount
              </FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-13 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="re-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={isLoading}
                  className="pl-7!"
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.amount.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Frequency ────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-13">Frequency</FieldLabel>
              <Select
                value={watchFrequency}
                onValueChange={(val) =>
                  setValue("frequency", val as RecurringFormData["frequency"])
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full text-xs sm:text-13">
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
              {errors.frequency && (
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.frequency.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Category ─────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-13">
                Category{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Select
                value={watchCategory ?? ""}
                onValueChange={(val) => setValue("category_id", val || null)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full text-xs sm:text-13">
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
                          <CategoryIcon icon={cat.icon} size={13} />
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            {/* ── Payment method ────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-13">
                Payment method
              </FieldLabel>
              <Select
                value={watchPaymentMethod}
                onValueChange={(val) =>
                  setValue(
                    "payment_method",
                    val as RecurringFormData["payment_method"],
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full text-xs sm:text-13">
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
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.payment_method.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Start & End date ─────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Field>
                <FieldLabel className="text-xs sm:text-13">
                  Start date
                </FieldLabel>
                <DatePicker
                  value={watchStartDate ?? ""}
                  onChange={(v) =>
                    setValue("start_date", v, { shouldValidate: true })
                  }
                  placeholder="Pick start date"
                  disabled={isLoading}
                />
                {errors.start_date && (
                  <FieldDescription className="text-destructive text-xs sm:text-13">
                    {errors.start_date.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-xs sm:text-13">
                  End date{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <DatePicker
                  value={watchEndDate ?? ""}
                  onChange={(v) => setValue("end_date", v || null)}
                  placeholder="No end date"
                  disabled={isLoading}
                />
              </Field>
            </div>

            {/* ── Status ───────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-13">Status</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={watchedIsActive ? "default" : "outline"}
                  className="w-full text-xs sm:text-13"
                  disabled={isLoading}
                  onClick={() => setValue("is_active", true)}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!watchedIsActive ? "default" : "outline"}
                  className="w-full text-xs sm:text-13"
                  disabled={isLoading}
                  onClick={() => setValue("is_active", false)}
                >
                  Paused
                </Button>
              </div>
              <FieldDescription className="text-xs sm:text-13">
                {`Paused expenses won't generate new transactions.`}
              </FieldDescription>
            </Field>

            {/* ── Description ──────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="re-desc" className="text-xs sm:text-13">
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
                className="resize-none text-xs sm:text-13"
                {...register("description")}
              />
              {errors.description && (
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.description.message}
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
                    className="w-full text-xs sm:text-13"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete recurring expense
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
                      className="text-xs sm:text-13"
                      disabled={isLoading}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-xs sm:text-13"
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
                className="flex-1 text-xs sm:text-13"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 text-xs sm:text-13"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {isSaving ? <Spinner /> : ""}
                  {isEditing ? "Save changes" : "Add recurring"}
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
