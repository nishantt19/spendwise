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

import { formatCurrency, formatNextDueDate, type DueDateStatus } from "@/lib/format";
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
      <div className="flex flex-col gap-6">
        {/* ── Add button ────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreateSheet}>
            <span className="flex items-center justify-center gap-1.5">
              <Plus size={15} />
              Add recurring
            </span>
          </Button>
        </div>

        {/* ── Summary cards ─────────────────────────────────────────── */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
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

        {/* ── Table ─────────────────────────────────────────────────── */}
        {expenses.length === 0 ? (
          <EmptyState onAddClick={openCreateSheet} />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-left font-medium">Frequency</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Category</th>
                  <th className="px-4 py-2.5 text-left font-medium">Next due</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
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
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Recurring row ────────────────────────────────────────────────────────────

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

  const isDue = expense.is_active && (dueStatus === "overdue" || dueStatus === "today");

  const dueLabelClass: Record<DueDateStatus, string> = {
    overdue: "text-red-500",
    today: "text-amber-500",
    soon: "text-amber-500",
    upcoming: "text-muted-foreground",
  };

  const cat = expense.category;

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => onRowClick(expense)}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {cat?.color ? (
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-md"
              style={{
                backgroundColor: `${cat.color}1a`,
                border: `1px solid ${cat.color}30`,
              }}
            >
              <CategoryIcon name={cat.name} size={13} color={cat.color} />
            </div>
          ) : (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <CategoryIcon name={cat?.name ?? ""} size={13} className="text-muted-foreground" />
            </div>
          )}
          <span className="max-w-40 truncate font-medium">{expense.name}</span>
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
        {formatCurrency(expense.amount)}
      </td>

      {/* Frequency */}
      <td className="px-4 py-3 text-muted-foreground">
        {RECURRING_FREQUENCY_LABELS[expense.frequency]}
      </td>

      {/* Status */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onToggleActive(expense)}>
          <Badge
            variant={expense.is_active ? "default" : "secondary"}
            className={`text-[11px] transition-colors ${
              expense.is_active
                ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-700"
                : "hover:bg-muted"
            }`}
          >
            {expense.is_active ? "Active" : "Paused"}
          </Badge>
        </button>
      </td>

      {/* Category */}
      <td className="px-4 py-3 text-muted-foreground">
        {cat ? cat.name : <span className="text-muted-foreground/50">—</span>}
      </td>

      {/* Next due date */}
      <td className={`px-4 py-3 text-sm ${expense.is_active ? dueLabelClass[dueStatus] : "text-muted-foreground/50"}`}>
        {expense.is_active ? dueLabel : "—"}
      </td>

      {/* Actions */}
      <td
        className="px-4 py-3 text-right"
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
                  ${isDue
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

          {/* Delete */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete(expense)}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
        <RefreshCw04 size={24} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No recurring expenses yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Set up expenses that repeat on a schedule — subscriptions, rent, EMIs.
      </p>
      <Button size="sm" className="mt-5" onClick={onAddClick}>
        <span className="flex items-center justify-center gap-1.5">
          <Plus size={15} />
          Add recurring
        </span>
      </Button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function RecurringContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border p-4">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["Name", "Amount", "Frequency", "Status", "Category", "Next due", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left">
                  <Skeleton className="h-3 w-12 rounded" />
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
                <td className="px-4 py-3"><Skeleton className="h-3 w-16 rounded" /></td>
                <td className="px-4 py-3"><Skeleton className="h-3 w-14 rounded" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-3 w-20 rounded" /></td>
                <td className="px-4 py-3"><Skeleton className="h-3 w-20 rounded" /></td>
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
