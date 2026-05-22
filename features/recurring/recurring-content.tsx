"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Plus, RefreshCw04, Trash01, FilePlus02 } from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { TypographyH2 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
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
import { getCategoryColor, getCategoryBg } from "@/lib/category-color";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleToggleActive(id: string, newValue: boolean) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_active: newValue } : e)),
    );
  }

  async function handleDelete(expense: RecurringWithCategory) {
    setDeletingId(expense.id);
    const result = await deleteRecurringExpense(expense.id);
    if (result.status === "error") {
      toast.error(result.message);
      setDeletingId(null);
      return;
    }
    toast.success(result.message);
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    setDeletingId(null);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = activeExpenses.filter(
    (e) => new Date(e.next_due_date + "T00:00:00") < today,
  ).length;

  const [activeTab, setActiveTab] = useState<"all" | "active" | "paused">(
    "all",
  );
  const filteredExpenses =
    activeTab === "active"
      ? expenses.filter((e) => e.is_active)
      : activeTab === "paused"
        ? expenses.filter((e) => !e.is_active)
        : expenses;

  const tabs: {
    key: "all" | "active" | "paused";
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "All", count: expenses.length },
    { key: "active", label: "Active", count: activeExpenses.length },
    { key: "paused", label: "Paused", count: pausedCount },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* ── Header ────────────────────────────────────────────── */}
        <div>
          <TypographyH2>Recurring</TypographyH2>
          <p className="mt-0.5 text-xs sm:text-13 text-muted-foreground">
            {expenses.length === 0 ? (
              "No recurring expenses yet"
            ) : (
              <>
                <span className="sm:hidden">
                  {activeExpenses.length} active ·{" "}
                  {formatCurrency(monthlyTotal)}/mo
                </span>
                <span className="hidden sm:inline">
                  {activeExpenses.length} active subscription
                  {activeExpenses.length !== 1 ? "s" : ""} · {pausedCount}{" "}
                  paused
                  {overdueCount > 0 && ` · ${overdueCount} overdue`}{" "}
                  <span
                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-10 font-medium align-middle"
                    style={{
                      background: "var(--warning-soft)",
                      color: "var(--warning)",
                    }}
                  >
                    {formatCurrency(monthlyTotal)}/mo
                  </span>
                </span>
              </>
            )}
          </p>
        </div>

        {/* ── Filter bar: tabs + add button ─────────────────────── */}
        <div className="flex items-center justify-end gap-2">
          {expenses.length > 0 && (
            <div className="hidden sm:flex items-center gap-0.5 rounded-lg p-0.5 h-9 bg-muted">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 h-full text-xs font-medium transition-all",
                    activeTab === tab.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-10 tabular-nums font-medium",
                      activeTab === tab.key
                        ? "bg-primary-soft text-primary"
                        : "bg-card/60 text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}
          <Button size="sm" className="gap-1.5" onClick={openCreateSheet}>
            <Plus size={15} />
            <span className="hidden sm:inline">Add recurring</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Timeline ───────────────────────────────────────────── */}
        {activeExpenses.length > 0 && (
          <RecurringTimeline expenses={activeExpenses} />
        )}

        {/* ── Mobile subscriptions heading + pill tabs ────────────── */}
        {expenses.length > 0 && (
          <div className="sm:hidden flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-tight px-0.5">
              Subscriptions
            </p>
            <div className="flex items-center gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                    activeTab === tab.key
                      ? "bg-primary-soft text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.label}
                  <span className="tabular-nums text-10">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── List / table ───────────────────────────────────────────── */}
        {expenses.length === 0 ? (
          <EmptyState onAddClick={openCreateSheet} />
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border bg-card">
            <p className="text-xs sm:text-13 font-medium">
              No {activeTab} subscriptions
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card list (hidden on sm+) */}
            <div className="sm:hidden flex flex-col gap-1.5">
              {filteredExpenses.map((expense) => (
                <RecurringCard
                  key={expense.id}
                  expense={expense}
                  onCardClick={openEditSheet}
                  onAddToExpense={handleAddToExpense}
                />
              ))}
            </div>

            {/* Tablet/Desktop: table (hidden on mobile) */}
            <div className="hidden sm:block overflow-hidden rounded-xl border bg-card">
              {/* Table card header */}
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between border-b bg-card">
                <div>
                  <p className="text-13 font-semibold">Subscriptions</p>
                  <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
                    {activeExpenses.length} active
                    {pausedCount > 0 ? ` · ${pausedCount} paused` : ""}
                  </p>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted light:bg-muted/50 text-10 font-medium uppercase tracking-[0.08em] text-subtle-foreground">
                    <th className="px-4 py-2.5 text-left">Subscription</th>
                    <th className="hidden md:table-cell px-4 py-2.5 text-left">
                      Category
                    </th>
                    <th className="px-4 py-2.5 text-left">Billing</th>
                    <th
                      className="px-4 py-2.5 text-left"
                      style={{ color: "var(--subtle-foreground)" }}
                    >
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left">Next due</th>
                    <th className="px-4 py-2.5 text-right text-10">Amount</th>
                    <th className="w-20 px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <RecurringRow
                      key={expense.id}
                      expense={expense}
                      onRowClick={openEditSheet}
                      onToggleSuccess={handleToggleActive}
                      onDelete={handleDelete}
                      onAddToExpense={handleAddToExpense}
                      isDeleting={deletingId === expense.id}
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

function merchantColor(name: string): string {
  const palettes = [
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--info)",
    "var(--warning)",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
  return palettes[h % palettes.length];
}

function RecurringTimeline({
  expenses,
}: {
  expenses: RecurringWithCategory[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const HALF = 30;
  const SPAN = 60;

  const events = expenses
    .map((e) => {
      const due = new Date(e.next_due_date + "T00:00:00");
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
      return { ...e, diff };
    })
    .filter((e) => e.diff >= -HALF && e.diff <= HALF);

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs sm:text-13 font-semibold">
            <span className="sm:hidden">60-day timeline</span>
            <span className="hidden sm:inline">60-day renewal timeline</span>
          </p>
          <p className="text-11 text-muted-foreground">
            <span className="sm:hidden">Past due left of today</span>
            <span className="hidden sm:inline">
              Past due to the left of today · upcoming to the right
            </span>
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-11 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm inline-block"
              style={{ background: "var(--destructive)" }}
            />
            Overdue
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm inline-block"
              style={{ background: "var(--primary)" }}
            />
            Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm inline-block"
              style={{ background: "var(--foreground)" }}
            />
            Today
          </span>
        </div>
      </div>

      {/* Timeline chips above axis */}
      <div className="relative" style={{ height: 56 }}>
        {/* Axis line */}
        <div
          className="absolute left-0 right-0 rounded-full"
          style={{ top: 40, height: 2, background: "var(--border)" }}
        />
        {/* Week ticks + labels */}
        {[
          { p: 0, l: "−30d" },
          { p: 0.25, l: "−15d" },
          {
            p: 0.5,
            l: `Today · ${today.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
          },
          { p: 0.75, l: "+15d" },
          { p: 1, l: "+30d" },
        ].map((t) => (
          <div
            key={t.p}
            style={{
              position: "absolute",
              left: `${t.p * 100}%`,
              top: 34,
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                width: 1,
                height: 8,
                background: "var(--border)",
                margin: "0 auto",
              }}
            />
            <div
              className="text-10 text-muted-foreground whitespace-nowrap text-center mt-1"
              style={{ fontWeight: t.l === "Today" ? 600 : 400 }}
            >
              {t.l}
            </div>
          </div>
        ))}
        {/* Today marker */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: 0,
            bottom: 16,
            width: 2,
            background: "var(--foreground)",
            transform: "translateX(-50%)",
            opacity: 0.8,
          }}
        />
        {/* Events */}
        {events.map((e) => {
          const pct = ((e.diff + HALF) / SPAN) * 100;
          const overdue = e.diff < 0;
          const color = merchantColor(e.name);
          return (
            <div
              key={e.id}
              title={`${e.name} · ${formatCurrency(e.amount)} · ${overdue ? `${Math.abs(e.diff)}d overdue` : `due in ${e.diff}d`}`}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: 4,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: `color-mix(in oklch, ${color} 18%, var(--muted))`,
                  color,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  border: overdue
                    ? "1.5px solid var(--destructive)"
                    : "1.5px solid var(--border)",
                }}
              >
                {e.name.charAt(0).toUpperCase()}
              </div>
              <div
                style={{
                  width: 2,
                  height: 8,
                  background: overdue ? "var(--destructive)" : "var(--primary)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile recurring card ────────────────────────────────────────────────────

function RecurringCard({
  expense,
  onCardClick,
  onAddToExpense,
}: {
  expense: RecurringWithCategory;
  onCardClick: (expense: RecurringWithCategory) => void;
  onAddToExpense: (expense: RecurringWithCategory) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { label: dueLabel, status: dueStatus } = expense.is_active
    ? formatNextDueDate(expense.next_due_date)
    : { label: "Paused", status: "upcoming" as DueDateStatus };

  const isDue =
    expense.is_active && (dueStatus === "overdue" || dueStatus === "today");
  const cat = expense.category;
  const rawColor = cat?.color ?? "#6b7280";
  const color = getCategoryColor(rawColor, isDark);
  const iconBg = getCategoryBg(rawColor, isDark);

  const dueStyle: Record<DueDateStatus, React.CSSProperties> = {
    overdue: { color: "var(--destructive)" },
    today: { color: "var(--warning)" },
    soon: { color: "var(--warning)" },
    upcoming: { color: "var(--muted-foreground)" },
  };

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 bg-card border border-border rounded-xl cursor-pointer active:bg-muted/30 transition-colors"
      onClick={() => onCardClick(expense)}
    >
      {/* Icon */}
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: iconBg, color }}
      >
        <CategoryIcon icon={cat?.icon} size={16} style={{ color }} />
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{expense.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 text-10 text-muted-foreground">
          <span>{RECURRING_FREQUENCY_LABELS[expense.frequency]}</span>
          <span>·</span>
          <span
            style={
              expense.is_active
                ? dueStyle[dueStatus]
                : { color: "var(--muted-foreground)", opacity: 0.5 }
            }
          >
            {dueLabel}
          </span>
        </div>
      </div>

      {/* Amount + add-to-expense */}
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isDue && (
          <button
            onClick={() => onAddToExpense(expense)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-emerald-500 transition-colors active:bg-emerald-500/10"
          >
            <FilePlus02 size={13} />
          </button>
        )}
        <p className="text-sm font-semibold tabular-nums">
          {formatCurrency(expense.amount)}
        </p>
      </div>
    </div>
  );
}

// ─── Desktop recurring row ────────────────────────────────────────────────────

function RecurringRow({
  expense,
  onRowClick,
  onToggleSuccess,
  onDelete,
  onAddToExpense,
  isDeleting,
}: {
  expense: RecurringWithCategory;
  onRowClick: (expense: RecurringWithCategory) => void;
  onToggleSuccess: (id: string, newValue: boolean) => void;
  onDelete: (expense: RecurringWithCategory) => void;
  onAddToExpense: (expense: RecurringWithCategory) => void;
  isDeleting: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [optimisticActive, setOptimisticActive] = useOptimistic(
    expense.is_active,
  );
  const [, startToggleTransition] = useTransition();

  const { label: dueLabel, status: dueStatus } = optimisticActive
    ? formatNextDueDate(expense.next_due_date)
    : { label: "Paused", status: "upcoming" as DueDateStatus };

  const isDue =
    optimisticActive && (dueStatus === "overdue" || dueStatus === "today");

  function handleToggle() {
    const next = !optimisticActive;
    startToggleTransition(async () => {
      setOptimisticActive(next);
      const result = await toggleRecurringActive(expense.id, next);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        onToggleSuccess(expense.id, next);
      }
    });
  }

  const dueLabelStyle: Record<DueDateStatus, React.CSSProperties> = {
    overdue: { color: "var(--destructive)" },
    today: { color: "var(--warning)" },
    soon: { color: "var(--warning)" },
    upcoming: { color: "var(--muted-foreground)" },
  };

  const cat = expense.category;
  const rawColor = cat?.color ?? "#6b7280";
  const color = getCategoryColor(rawColor, isDark);
  const iconBg = getCategoryBg(rawColor, isDark);

  return (
    <tr
      className="group cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/30"
      onClick={() => onRowClick(expense)}
    >
      {/* Name */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: iconBg, color }}
          >
            <CategoryIcon icon={cat?.icon} size={15} style={{ color }} />
          </div>
          <p className="truncate text-13 font-medium max-w-36 sm:max-w-44 min-w-0">
            {expense.name}
          </p>
        </div>
      </td>

      {/* Category */}
      <td className="hidden md:table-cell px-4 py-3.5">
        {cat ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-medium"
            style={{ background: iconBg, color }}
          >
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{ background: color }}
            />
            {cat.name}
          </span>
        ) : (
          <span className="text-11 text-muted-foreground/50">—</span>
        )}
      </td>

      {/* Billing frequency */}
      <td className="px-4 py-3.5 text-xs text-muted-foreground">
        {RECURRING_FREQUENCY_LABELS[expense.frequency]}
      </td>

      {/* Status */}
      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleToggle}
          className="transition-opacity hover:opacity-80"
        >
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-medium"
            style={
              optimisticActive
                ? { background: "var(--primary-soft)", color: "var(--primary)" }
                : {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{
                background: optimisticActive
                  ? "var(--primary)"
                  : "var(--muted-foreground)",
              }}
            />
            {optimisticActive ? "Active" : "Paused"}
          </span>
        </button>
      </td>

      {/* Next due */}
      <td
        className="px-4 py-3.5 text-xs font-medium"
        style={
          optimisticActive
            ? dueLabelStyle[dueStatus]
            : { color: "var(--muted-foreground)", opacity: 0.4 }
        }
      >
        {optimisticActive ? dueLabel : "—"}
      </td>

      {/* Amount */}
      <td className="px-4 py-3.5 text-right text-13 font-semibold tabular-nums">
        {formatCurrency(expense.amount)}
      </td>

      {/* Actions */}
      <td
        className="px-4 py-3.5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => isDue && onAddToExpense(expense)}
                disabled={!isDue}
                className={`inline-flex size-7 items-center justify-center rounded-md transition-colors ${
                  isDue
                    ? "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"
                    : "cursor-not-allowed text-muted-foreground/25"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete(expense)}
                disabled={isDeleting}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-100 disabled:text-destructive"
              >
                {isDeleting ? <Spinner className="size-3.5" /> : <Trash01 size={14} />}
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
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center rounded-xl border bg-card">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted">
        <RefreshCw04 size={20} className="text-muted-foreground" />
      </div>
      <p className="text-xs sm:text-13 font-medium">
        No recurring expenses yet
      </p>
      <p className="mt-1 text-11 sm:text-xs text-muted-foreground max-w-xs">
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
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-8 w-20 sm:w-28 rounded-md shrink-0" />
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
        <table className="w-full text-xs sm:text-13">
          <thead>
            <tr className="border-b bg-muted/60">
              {[
                "Subscription",
                "Amount",
                "Billing",
                "Status",
                "Next due",
                "",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <Skeleton className="h-2.5 w-12 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...Array(4)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-7 rounded-md" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="ml-auto h-3 w-16 rounded" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-3 w-14 rounded" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="size-1.5 rounded-full" />
                    <Skeleton className="h-3 w-10 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-3 w-20 rounded" />
                </td>
                <td className="px-4 py-3.5 text-right">
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
