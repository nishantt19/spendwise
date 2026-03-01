"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw04, Trash01, FilePlus02 } from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  formatCurrency,
  formatNextDueDate,
  type DueDateStatus,
} from "@/lib/format";
import { CategoryIcon } from "@/lib/category-icons";
import {
  RECURRING_FREQUENCY_LABELS,
  RECURRING_MONTHLY_MULTIPLIERS,
} from "@/schema/recurring";
import {
  getRecurringExpenses,
  toggleRecurringActive,
  deleteRecurringExpense,
  addRecurringToExpense,
} from "@/actions/recurring";
import { RecurringSheet } from "./recurring-sheet";
import type { RecurringWithCategory } from "@/types/recurring";
import type { Category } from "@/types/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecurringContentProps = {
  initialExpenses: RecurringWithCategory[];
  categories: Category[];
};

// ─── Root component ───────────────────────────────────────────────────────────

export function RecurringContent({
  initialExpenses,
  categories,
}: RecurringContentProps) {
  const [expenses, setExpenses] =
    useState<RecurringWithCategory[]>(initialExpenses);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] =
    useState<RecurringWithCategory | null>(null);
  const [, startTransition] = useTransition();

  // Optimistic toggle: flip is_active immediately, revert on error
  function handleToggleActive(expense: RecurringWithCategory) {
    const next = !expense.is_active;
    setExpenses((prev) =>
      prev.map((e) => (e.id === expense.id ? { ...e, is_active: next } : e)),
    );
    startTransition(async () => {
      const result = await toggleRecurringActive(expense.id, next);
      if (result.status === "error") {
        toast.error(result.message);
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === expense.id ? { ...e, is_active: !next } : e,
          ),
        );
      }
    });
  }

  function handleDelete(expense: RecurringWithCategory) {
    startTransition(async () => {
      const result = await deleteRecurringExpense(expense.id);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    });
  }

  function handleAddToExpense(expense: RecurringWithCategory) {
    startTransition(async () => {
      const result = await addRecurringToExpense(expense.id);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      // Refresh to get updated next_due_date
      const refreshed = await getRecurringExpenses();
      if (!refreshed.error) setExpenses(refreshed.data);
    });
  }

  // Re-fetch after any mutation via the sheet
  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const result = await getRecurringExpenses();
      if (!result.error) setExpenses(result.data);
    });
  }, []);

  function openCreateSheet() {
    setSelectedExpense(null);
    setSheetOpen(true);
  }

  function openEditSheet(expense: RecurringWithCategory) {
    setSelectedExpense(expense);
    setSheetOpen(true);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const activeExpenses = expenses.filter((e) => e.is_active);
  const pausedCount = expenses.length - activeExpenses.length;
  const monthlyTotal = activeExpenses.reduce(
    (sum, e) => sum + e.amount * RECURRING_MONTHLY_MULTIPLIERS[e.frequency],
    0,
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* ── Add button ────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" onClick={openCreateSheet}>
            <Plus size={15} />
            <span className="hidden sm:inline">Add recurring</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Summary cards ─────────────────────────────────────────── */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <SummaryCard
              label="Est. monthly"
              value={formatCurrency(monthlyTotal)}
              variant="default"
            />
            <SummaryCard
              label="Active"
              value={String(activeExpenses.length)}
              variant="success"
            />
            <SummaryCard
              label="Paused"
              value={String(pausedCount)}
              variant={pausedCount > 0 ? "pending" : "default"}
            />
          </div>
        )}

        {/* ── List / table ───────────────────────────────────────────── */}
        {expenses.length === 0 ? (
          <EmptyState onAddClick={openCreateSheet} />
        ) : (
          <>
            {/* Mobile: card list (hidden on sm+) */}
            <div className="sm:hidden overflow-hidden rounded-xl border divide-y">
              {expenses.map((expense) => (
                <RecurringCard
                  key={expense.id}
                  expense={expense}
                  onCardClick={openEditSheet}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  onAddToExpense={handleAddToExpense}
                />
              ))}
            </div>

            {/* Tablet/Desktop: table (hidden on mobile) */}
            <div className="hidden sm:block overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60 text-1.5xs sm:text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                      Name
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-right font-medium">
                      Amount
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                      Frequency
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-4 py-2.5 text-left font-medium">
                      Category
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                      Next due
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <RecurringRow
                      key={expense.id}
                      expense={expense}
                      onRowClick={openEditSheet}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                      onAddToExpense={handleAddToExpense}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Sheet ──────────────────────────────────────────────────────── */}
      <RecurringSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        categories={categories}
        expense={selectedExpense}
        onSuccess={handleRefresh}
      />
    </TooltipProvider>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "default" | "success" | "pending";
}) {
  const valueClass =
    variant === "success"
      ? "text-emerald-600"
      : variant === "pending"
        ? "text-amber-600"
        : "text-foreground";

  return (
    <div className="flex flex-col gap-0.5 sm:gap-1 rounded-xl border bg-card p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-base sm:text-lg font-semibold tabular-nums truncate ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Mobile recurring card ────────────────────────────────────────────────────

function RecurringCard({
  expense,
  onCardClick,
  onToggleActive,
  onDelete,
  onAddToExpense,
}: {
  expense: RecurringWithCategory;
  onCardClick: (expense: RecurringWithCategory) => void;
  onToggleActive: (expense: RecurringWithCategory) => void;
  onDelete: (expense: RecurringWithCategory) => void;
  onAddToExpense: (expense: RecurringWithCategory) => void;
}) {
  const { label: dueLabel, status: dueStatus } = expense.is_active
    ? formatNextDueDate(expense.next_due_date)
    : { label: "—", status: "upcoming" as DueDateStatus };

  const isDue =
    expense.is_active && (dueStatus === "overdue" || dueStatus === "today");
  const cat = expense.category;
  const color = cat?.color ?? "#6b7280";

  const dueClass: Record<DueDateStatus, string> = {
    overdue: "text-red-500",
    today: "text-amber-500",
    soon: "text-amber-500",
    upcoming: "text-muted-foreground",
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors"
      onClick={() => onCardClick(expense)}
    >
      {/* Icon */}
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${color}1a`,
          border: `1px solid ${color}30`,
        }}
      >
        <CategoryIcon icon={cat?.icon} size={14} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate">{expense.name}</span>
          <span className="text-xs font-semibold tabular-nums shrink-0">
            {formatCurrency(expense.amount)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {RECURRING_FREQUENCY_LABELS[expense.frequency]}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span
            className={`text-[10px] ${expense.is_active ? dueClass[dueStatus] : "text-muted-foreground/50"}`}
          >
            {expense.is_active ? dueLabel : "Paused"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Add to expense — only when due */}
        {isDue && (
          <button
            onClick={() => onAddToExpense(expense)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-600/10"
          >
            <FilePlus02 size={13} />
          </button>
        )}

        {/* Toggle active */}
        <button
          onClick={() => onToggleActive(expense)}
          className={`flex size-7 shrink-0 items-center justify-center rounded-md transition-colors text-[10px] font-semibold ${
            expense.is_active
              ? "bg-emerald-600/10 text-emerald-600"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {expense.is_active ? "On" : "Off"}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(expense)}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash01 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Desktop recurring row ────────────────────────────────────────────────────

function RecurringRow({
  expense,
  onRowClick,
  onToggleActive,
  onDelete,
  onAddToExpense,
}: {
  expense: RecurringWithCategory;
  onRowClick: (expense: RecurringWithCategory) => void;
  onToggleActive: (expense: RecurringWithCategory) => void;
  onDelete: (expense: RecurringWithCategory) => void;
  onAddToExpense: (expense: RecurringWithCategory) => void;
}) {
  const { label: dueLabel, status: dueStatus } = expense.is_active
    ? formatNextDueDate(expense.next_due_date)
    : { label: "Paused", status: "upcoming" as DueDateStatus };

  const isDue =
    expense.is_active && (dueStatus === "overdue" || dueStatus === "today");

  const dueLabelClass: Record<DueDateStatus, string> = {
    overdue: "text-red-500",
    today: "text-amber-500",
    soon: "text-amber-500",
    upcoming: "text-muted-foreground",
  };

  const cat = expense.category;
  const color = cat?.color ?? "#6b7280";

  return (
    <tr
      className="group cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/40"
      onClick={() => onRowClick(expense)}
    >
      {/* Name */}
      <td className="px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md"
            style={{
              backgroundColor: `${color}1a`,
              border: `1px solid ${color}30`,
            }}
          >
            <CategoryIcon icon={cat?.icon} size={13} />
          </div>
          <span className="max-w-28 sm:max-w-40 truncate font-medium text-error sm:text-sm">
            {expense.name}
          </span>
        </div>
      </td>

      {/* Amount — right-aligned */}
      <td className="px-3 sm:px-4 py-3 text-right text-error sm:text-sm font-semibold tabular-nums">
        {formatCurrency(expense.amount)}
      </td>

      {/* Frequency */}
      <td className="px-3 sm:px-4 py-3 text-error sm:text-sm text-muted-foreground">
        {RECURRING_FREQUENCY_LABELS[expense.frequency]}
      </td>

      {/* Status */}
      <td className="px-3 sm:px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onToggleActive(expense)}>
          <Badge
            variant={expense.is_active ? "default" : "secondary"}
            className={`text-[10px] sm:text-1.5xs transition-colors ${
              expense.is_active
                ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-700"
                : "hover:bg-muted"
            }`}
          >
            {expense.is_active ? "Active" : "Paused"}
          </Badge>
        </button>
      </td>

      {/* Category — hidden on sm, shown on md+ */}
      <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
        {cat ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-1.5xs sm:text-xs text-muted-foreground font-medium">
            {cat.name}
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>

      {/* Next due date */}
      <td
        className={`px-3 sm:px-4 py-3 text-error sm:text-sm ${expense.is_active ? dueLabelClass[dueStatus] : "text-muted-foreground/50"}`}
      >
        {expense.is_active ? dueLabel : "—"}
      </td>

      {/* Actions */}
      <td
        className="px-3 sm:px-4 py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1">
          {/* Add to expense */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => isDue && onAddToExpense(expense)}
                disabled={!isDue}
                className={`inline-flex size-7 items-center justify-center rounded-md transition-colors
                  ${
                    isDue
                      ? "text-muted-foreground hover:bg-emerald-600/10 hover:text-emerald-600"
                      : "cursor-not-allowed text-muted-foreground/30"
                  }`}
              >
                <FilePlus02 size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isDue
                ? "Add to expenses"
                : `Due ${new Date(`${expense.next_due_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
            </TooltipContent>
          </Tooltip>

          {/* Delete — hover-only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete(expense)}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash01 size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="mb-3 flex size-12 sm:size-14 items-center justify-center rounded-full bg-muted">
        <RefreshCw04 size={22} className="text-muted-foreground" />
      </div>
      <p className="text-xs sm:text-sm font-medium">
        No recurring expenses yet
      </p>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xs">
        Set up expenses that repeat on a schedule — subscriptions, rent, EMIs.
      </p>
      <Button size="sm" className="mt-4 sm:mt-5 gap-1.5" onClick={onAddClick}>
        <Plus size={15} />
        Add recurring
      </Button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function RecurringContentSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-20 sm:w-28 rounded-md" />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-1 rounded-xl border p-3 sm:p-4"
          >
            <Skeleton className="h-2.5 w-14 rounded" />
            <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Mobile card skeleton */}
      <div className="sm:hidden overflow-hidden rounded-xl border divide-y">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-3 w-16 rounded shrink-0" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-2.5 w-14 rounded" />
                <Skeleton className="h-2.5 w-12 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden sm:block overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60">
              {[
                "Name",
                "Amount",
                "Frequency",
                "Status",
                "Category",
                "Next due",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left">
                  <Skeleton className="h-2.5 w-12 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...Array(4)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="h-3.5 w-32 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="ml-auto h-3 w-16 rounded" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-3 w-14 rounded" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <Skeleton className="h-5 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-3 w-20 rounded" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="size-7 rounded-md" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
