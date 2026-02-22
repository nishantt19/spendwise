"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw04 } from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCurrency, formatNextDueDate } from "@/lib/format";
import {
  RECURRING_FREQUENCY_LABELS,
  RECURRING_MONTHLY_MULTIPLIERS,
} from "@/schema/recurring";
import {
  getRecurringExpenses,
  toggleRecurringActive,
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
    <>
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

        {/* ── Expense list ──────────────────────────────────────────── */}
        {expenses.length === 0 ? (
          <EmptyState onAddClick={openCreateSheet} />
        ) : (
          <div className="flex flex-col divide-y rounded-xl border">
            {expenses.map((expense) => (
              <RecurringRow
                key={expense.id}
                expense={expense}
                onRowClick={openEditSheet}
                onToggleActive={handleToggleActive}
              />
            ))}
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
    </>
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
}: {
  expense: RecurringWithCategory;
  onRowClick: (expense: RecurringWithCategory) => void;
  onToggleActive: (expense: RecurringWithCategory) => void;
}) {
  const { label: dueLabel, status: dueStatus } = expense.is_active
    ? formatNextDueDate(expense.next_due_date)
    : { label: "", status: "upcoming" as const };

  const dueLabelClass = {
    overdue: "text-red-500",
    today: "text-amber-500",
    soon: "text-amber-500",
    upcoming: "text-muted-foreground",
  }[dueStatus];

  const cat = expense.category;

  return (
    <div className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl">
      {/* Clickable area: icon + text */}
      <button
        onClick={() => onRowClick(expense)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {/* Icon */}
        {cat?.color ? (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${cat.color}1a`,
              border: `1px solid ${cat.color}30`,
            }}
          >
            {cat.icon ? (
              <span className="text-base leading-none">{cat.icon}</span>
            ) : (
              <RefreshCw04 size={16} style={{ color: cat.color }} />
            )}
          </div>
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            {cat?.icon ? (
              <span className="text-base leading-none">{cat.icon}</span>
            ) : (
              <RefreshCw04 size={16} className="text-muted-foreground" />
            )}
          </div>
        )}

        {/* Name + frequency + due date */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{expense.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {RECURRING_FREQUENCY_LABELS[expense.frequency]}
            {expense.is_active && dueLabel && (
              <>
                {" · "}
                <span className={dueLabelClass}>{dueLabel}</span>
              </>
            )}
          </p>
        </div>

        {/* Amount */}
        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(expense.amount)}
        </p>
      </button>

      {/* Active / Paused toggle */}
      <button
        onClick={() => onToggleActive(expense)}
        className="ml-2 shrink-0"
      >
        <Badge
          variant={expense.is_active ? "default" : "secondary"}
          className={`text-[11px] transition-colors ${
            expense.is_active
              ? "bg-emerald-600 hover:bg-emerald-700 border-transparent text-white"
              : "hover:bg-muted"
          }`}
        >
          {expense.is_active ? "Active" : "Paused"}
        </Badge>
      </button>
    </div>
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
      <div className="flex flex-col divide-y rounded-xl border">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
