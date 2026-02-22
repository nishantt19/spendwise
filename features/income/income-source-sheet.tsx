"use client";

import { useEffect, useTransition, useState } from "react";
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
import type { IncomeSource, IncomeSourceFormData } from "@/types/income-sources";

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

  const form = useForm<IncomeSourceFormData>({
    resolver: zodResolver(incomeSourceSchema),
    defaultValues: buildDefaults(null, defaultMonth, defaultYear),
  });

  const isLoading = isSaving || isDeleting;
  const watchedIsReceived = form.watch("is_received");

  // Sync form when sheet opens or source changes
  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    form.reset(buildDefaults(source ?? null, defaultMonth, defaultYear));
  }, [open, source, defaultMonth, defaultYear, form]);

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

  // Year options: 5 years back to 5 years forward
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            {isEditing ? "Edit income source" : "New income source"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the details of this income source."
              : "Add an expected income entry for the selected month."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex flex-col gap-5 px-6 py-5">
            {/* ── Name ─────────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="is-name">Name</FieldLabel>
              <Input
                id="is-name"
                placeholder="e.g. Main Salary, Freelance Project"
                disabled={isLoading}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.name.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Source type ───────────────────────────────────────────── */}
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select
                value={form.watch("source_type")}
                onValueChange={(val) =>
                  form.setValue(
                    "source_type",
                    val as IncomeSourceFormData["source_type"],
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger>
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
              {form.formState.errors.source_type && (
                <FieldDescription className="text-destructive">
                  {form.formState.errors.source_type.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Amount ───────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="is-amount">Expected amount</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="is-amount"
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

            {/* ── Month & Year ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Month</FieldLabel>
                <Select
                  value={String(form.watch("month"))}
                  onValueChange={(val) =>
                    form.setValue("month", Number(val))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
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
                <FieldLabel>Year</FieldLabel>
                <Select
                  value={String(form.watch("year"))}
                  onValueChange={(val) =>
                    form.setValue("year", Number(val))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
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

            {/* ── Status ───────────────────────────────────────────────── */}
            <Field>
              <FieldLabel>Status</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={!watchedIsReceived ? "default" : "outline"}
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => form.setValue("is_received", false)}
                >
                  Pending
                </Button>
                <Button
                  type="button"
                  variant={watchedIsReceived ? "default" : "outline"}
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => form.setValue("is_received", true)}
                >
                  Received
                </Button>
              </div>
            </Field>

            {/* ── Note ─────────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="is-note">
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

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <SheetFooter className="mt-auto flex-col gap-2 border-t px-6 py-4">
            {/* Delete row — edit mode only */}
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
                    Delete source
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
                  {isEditing ? "Save changes" : "Add source"}
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
    // amount omitted → renders as blank number input
    month: defaultMonth,
    year: defaultYear,
    is_received: false,
    note: "",
  };
}
