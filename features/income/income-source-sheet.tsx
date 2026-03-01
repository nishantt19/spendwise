"use client";

import { useEffect, useTransition, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
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
  incomeSourceSchema,
  INCOME_SOURCE_TYPES,
  INCOME_SOURCE_TYPE_LABELS,
  MONTH_LABELS,
} from "@/schema/income-sources";
import {
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
} from "@/actions/income-sources";
import type {
  IncomeSource,
  IncomeSourceFormData,
} from "@/types/income-sources";

// ─── Types ────────────────────────────────────────────────────────────────────

type IncomeSourceSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: IncomeSource | null;
  defaultMonth: number;
  defaultYear: number;
  onSuccess?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function IncomeSourceSheet({
  open,
  onOpenChange,
  source,
  defaultMonth,
  defaultYear,
  onSuccess,
}: IncomeSourceSheetProps) {
  const isEditing = !!source;
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<IncomeSourceFormData>({
    resolver: zodResolver(incomeSourceSchema),
    defaultValues: buildDefaults(null, defaultMonth, defaultYear),
  });

  const watchIsReceived = useWatch({
    control,
    name: "is_received",
  });

  const watchMonth = useWatch({
    control,
    name: "month",
  });

  const watchYear = useWatch({
    control,
    name: "year",
  });

  const watchSourceType = useWatch({
    control,
    name: "source_type",
  });

  const isLoading = isSaving || isDeleting;

  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(source ?? null, defaultMonth, defaultYear));
  }, [open, source, defaultMonth, defaultYear, reset]);

  function onSubmit(values: IncomeSourceFormData) {
    startSaveTransition(async () => {
      const result = isEditing
        ? await updateIncomeSource(source.id, values)
        : await createIncomeSource(values);

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
      const result = await deleteIncomeSource(source!.id);

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onSuccess?.();
      onOpenChange(false);
    });
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

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
            {isEditing ? "Edit income source" : "New income source"}
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            {isEditing
              ? "Update the details of this income source."
              : "Add an expected income entry for the selected month."}
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
              <FieldLabel htmlFor="is-name" className="text-xs sm:text-sm">
                Name
              </FieldLabel>
              <Input
                id="is-name"
                placeholder="e.g. Main Salary, Freelance Project"
                disabled={isLoading}
                className="text-xs sm:text-sm"
                {...register("name")}
              />
              {errors.name && (
                <FieldDescription className="text-destructive text-1.5xs sm:text-error">
                  {errors.name.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Source type ──────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-sm">Type</FieldLabel>
              <Select
                value={watchSourceType}
                onValueChange={(val) =>
                  setValue(
                    "source_type",
                    val as IncomeSourceFormData["source_type"],
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Select income type" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_SOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {INCOME_SOURCE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.source_type && (
                <FieldDescription className="text-destructive text-1.5xs sm:text-error">
                  {errors.source_type.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Amount ───────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="is-amount" className="text-xs sm:text-sm">
                Expected amount
              </FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="is-amount"
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
                <FieldDescription className="text-destructive text-1.5xs sm:text-error">
                  {errors.amount.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Month & Year ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Field>
                <FieldLabel className="text-xs sm:text-sm">Month</FieldLabel>
                <Select
                  value={String(watchMonth)}
                  onValueChange={(val) => setValue("month", Number(val))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_LABELS.map((label, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel className="text-xs sm:text-sm">Year</FieldLabel>
                <Select
                  value={String(watchYear)}
                  onValueChange={(val) => setValue("year", Number(val))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* ── Status ───────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-sm">Status</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={!watchIsReceived ? "default" : "outline"}
                  className="w-full text-xs sm:text-sm"
                  disabled={isLoading}
                  onClick={() => setValue("is_received", false)}
                >
                  Pending
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={watchIsReceived ? "default" : "outline"}
                  className="w-full text-xs sm:text-sm"
                  disabled={isLoading}
                  onClick={() => setValue("is_received", true)}
                >
                  Received
                </Button>
              </div>
            </Field>

            {/* ── Note ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="is-note" className="text-xs sm:text-sm">
                Note{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                id="is-note"
                placeholder="e.g. Paid on the 1st of each month"
                rows={3}
                disabled={isLoading}
                className="resize-none text-xs sm:text-sm"
                {...register("note")}
              />
              {errors.note && (
                <FieldDescription className="text-destructive text-1.5xs sm:text-error">
                  {errors.note.message}
                </FieldDescription>
              )}
            </Field>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2 border-t px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            {/* Delete row — edit mode only */}
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
                    Delete source
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
                  {isEditing ? "Save changes" : "Add source"}
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
  source: IncomeSource | null | undefined,
  defaultMonth: number,
  defaultYear: number,
) {
  if (source) {
    return {
      name: source.name,
      source_type: source.source_type,
      amount: source.amount,
      month: source.month,
      year: source.year,
      is_received: source.is_received,
      note: source.note ?? "",
    };
  }

  return {
    name: "",
    source_type: "salary" as const,
    month: defaultMonth,
    year: defaultYear,
    is_received: false,
    note: "",
  };
}
