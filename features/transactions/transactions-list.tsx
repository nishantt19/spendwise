"use client";

import { useTransition, Fragment } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Trash01, Receipt, Plus } from "@untitledui/icons";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PAYMENT_METHOD_LABELS } from "@/schema/transactions";
import { formatCurrency, formatDayLabel } from "@/lib/format";
import { softDeleteTransaction } from "@/actions/transactions";
import { CategoryIcon } from "@/lib/category-icons";
import { getCategoryColor, getCategoryBg } from "@/lib/category-color";
import type { PaymentMethodTab } from "./transactions-filters";
import type { TransactionWithCategory } from "@/types/transactions";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_TABS: { key: PaymentMethodTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "card", label: "Card" },
  { key: "upi", label: "UPI" },
  { key: "cash", label: "Cash" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionsListProps = {
  transactions: TransactionWithCategory[];
  total: number;
  isPending: boolean;
  activeTab: PaymentMethodTab;
  onTabChange: (tab: PaymentMethodTab) => void;
  onRowClick: (transaction: TransactionWithCategory) => void;
  onDelete: () => void;
  onAddClick?: () => void;
};

// ─── Root component ───────────────────────────────────────────────────────────

export function TransactionsList({
  transactions,
  total,
  isPending,
  activeTab,
  onTabChange,
  onRowClick,
  onDelete,
  onAddClick,
}: TransactionsListProps) {
  if (isPending && transactions.length === 0) {
    return <TransactionsSkeleton />;
  }

  if (!isPending && transactions.length === 0) {
    return (
      <>
        <MobileTabBadges activeTab={activeTab} onTabChange={onTabChange} />
        <EmptyState onAddClick={onAddClick} />
      </>
    );
  }

  const listStyle = {
    opacity: isPending ? 0.5 : 1,
    pointerEvents: isPending ? ("none" as const) : ("auto" as const),
    transition: "opacity 0.2s",
  };

  return (
    <div style={listStyle} className="flex flex-col gap-3">
      {/* Mobile: badge tab pills */}
      <MobileTabBadges activeTab={activeTab} onTabChange={onTabChange} />

      {/* Mobile: day-grouped cards */}
      <div className="sm:hidden">
        <MobileGroupedList
          transactions={transactions}
          onCardClick={onRowClick}
          onDeleteSuccess={onDelete}
        />
      </div>

      {/* Tablet/Desktop: table grouped by day */}
      <div className="hidden sm:block overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead>
            <tr className="border-b text-subtle-foreground text-10 font-medium uppercase tracking-[0.08em] bg-[color-mix(in_oklch,var(--muted)_50%,transparent)]">
              <th className="px-4 py-2.5 text-left">Description</th>
              <th className="px-4 py-2.5 text-left">Category</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="hidden md:table-cell px-4 py-2.5 text-left">
                Method
              </th>
              <th className="w-20 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            <GroupedTransactionRows
              transactions={transactions}
              onRowClick={onRowClick}
              onDeleteSuccess={onDelete}
            />
          </tbody>
        </table>
      </div>

      {/* Count */}
      <p className="text-center text-10 sm:text-xs text-muted-foreground">
        Showing {transactions.length} of {total} transaction
        {total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Mobile badge tab pills ───────────────────────────────────────────────────

function MobileTabBadges({
  activeTab,
  onTabChange,
}: {
  activeTab: PaymentMethodTab;
  onTabChange: (tab: PaymentMethodTab) => void;
}) {
  return (
    <div className="sm:hidden flex items-center gap-1.5">
      {METHOD_TABS.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all",
              isActive
                ? "bg-primary-soft text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Mobile grouped list ──────────────────────────────────────────────────────

function MobileGroupedList({
  transactions,
  onCardClick,
  onDeleteSuccess,
}: {
  transactions: TransactionWithCategory[];
  onCardClick: (tx: TransactionWithCategory) => void;
  onDeleteSuccess: () => void;
}) {
  const groups: { date: string; items: TransactionWithCategory[] }[] = [];
  const dateMap = new Map<string, TransactionWithCategory[]>();
  for (const tx of transactions) {
    if (!dateMap.has(tx.date)) {
      const arr: TransactionWithCategory[] = [];
      dateMap.set(tx.date, arr);
      groups.push({ date: tx.date, items: arr });
    }
    dateMap.get(tx.date)!.push(tx);
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const dayTotal = g.items.reduce((s, t) => s + t.amount, 0);
        const label = formatDayLabel(g.date);
        return (
          <div key={g.date} className="flex flex-col gap-1.5">
            {/* Day header */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-10 font-medium text-subtle-foreground uppercase">
                  {label}
                </span>
                <span className="text-10 text-subtle-foreground font-semibold">
                  ·
                </span>
                <span className="text-10 tabular-nums text-subtle-foreground uppercase">
                  {g.items.length} txn{g.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-xs tabular-nums font-medium text-muted-foreground">
                −{formatCurrency(dayTotal)}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-1">
              {g.items.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onCardClick={onCardClick}
                  onDeleteSuccess={onDeleteSuccess}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mobile transaction card ──────────────────────────────────────────────────

function TransactionCard({
  transaction: tx,
  onCardClick,
}: {
  transaction: TransactionWithCategory;
  onCardClick: (transaction: TransactionWithCategory) => void;
  onDeleteSuccess: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const cat = tx.category;
  const rawColor = cat?.color ?? "#6b7280";
  const color = getCategoryColor(rawColor, isDark);
  const iconBg = getCategoryBg(rawColor, isDark);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer rounded-xl border bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors"
      onClick={() => onCardClick(tx)}
    >
      {/* Icon */}
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: iconBg, color }}
      >
        <CategoryIcon icon={cat?.icon} size={16} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-medium truncate">
              {tx.description}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-10 font-medium"
                style={{ background: iconBg, color }}
              >
                {cat?.name ?? "Uncategorized"}
              </span>
              <span className="text-10 text-muted-foreground font-semibold">
                ·
              </span>
              <span className="text-10 text-muted-foreground">
                {PAYMENT_METHOD_LABELS[tx.payment_method]}
              </span>
            </div>
          </div>
          <span className="text-15 font-semibold tabular-nums shrink-0 text-foreground">
            −{formatCurrency(tx.amount)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Day-grouped desktop rows ─────────────────────────────────────────────────

function GroupedTransactionRows({
  transactions,
  onRowClick,
  onDeleteSuccess,
}: {
  transactions: TransactionWithCategory[];
  onRowClick: (transaction: TransactionWithCategory) => void;
  onDeleteSuccess: () => void;
}) {
  const groups: { date: string; items: TransactionWithCategory[] }[] = [];
  const dateMap = new Map<string, TransactionWithCategory[]>();
  for (const tx of transactions) {
    if (!dateMap.has(tx.date)) {
      const arr: TransactionWithCategory[] = [];
      dateMap.set(tx.date, arr);
      groups.push({ date: tx.date, items: arr });
    }
    dateMap.get(tx.date)!.push(tx);
  }

  return (
    <>
      {groups.map((g) => {
        const dayTotal = g.items.reduce((s, t) => s + t.amount, 0);
        const label = formatDayLabel(g.date);
        return (
          <Fragment key={g.date}>
            {/* Day header row */}
            <tr className="bg-muted/50">
              <td
                colSpan={2}
                className="px-4 py-2.5 text-10 font-medium uppercase tracking-[0.08em] border-b border-t border-border text-subtle-foreground"
              >
                {label}
              </td>
              <td className="px-4 py-2.5 text-right text-10 tabular-nums border-b border-t text-muted-foreground border-border">
                −{formatCurrency(dayTotal)}
              </td>
              <td className="hidden md:table-cell px-4 py-2.5 border-b border-t border-border" />
              <td className="px-4 py-2.5 text-right text-10 border-b border-t text-muted-foreground border-border uppercase">
                {g.items.length} txn{g.items.length !== 1 ? "s" : ""}
              </td>
            </tr>
            {g.items.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onRowClick={onRowClick}
                onDeleteSuccess={onDeleteSuccess}
              />
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

// ─── Desktop transaction row ──────────────────────────────────────────────────

function TransactionRow({
  transaction: tx,
  onRowClick,
  onDeleteSuccess,
}: {
  transaction: TransactionWithCategory;
  onRowClick: (transaction: TransactionWithCategory) => void;
  onDeleteSuccess: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const cat = tx.category;
  const rawColor = cat?.color ?? "#6b7280";
  const color = getCategoryColor(rawColor, isDark);
  const iconBg = getCategoryBg(rawColor, isDark);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    startDeleteTransition(async () => {
      const result = await softDeleteTransaction(tx.id);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onDeleteSuccess();
    });
  }

  return (
    <tr
      className="group cursor-pointer border-b last:border-0 bg-card transition-colors hover:bg-muted/30"
      onClick={() => onRowClick(tx)}
    >
      {/* Description */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: iconBg, color }}
          >
            <CategoryIcon icon={cat?.icon} size={15} style={{ color }} />
          </div>
          <div className="min-w-0">
            <span className="block max-w-36 sm:max-w-48 md:max-w-64 truncate text-13 font-medium">
              {tx.description}
            </span>
            <span className="text-11 text-muted-foreground">
              {PAYMENT_METHOD_LABELS[tx.payment_method]}
            </span>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-11 font-medium"
          style={{ background: iconBg, color }}
        >
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ background: color }}
          />
          {cat?.name ?? "Uncategorized"}
        </span>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right text-13 font-semibold tabular-nums text-destructive">
        −{formatCurrency(tx.amount)}
      </td>

      {/* Method */}
      <td className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-11 font-medium bg-muted text-muted-foreground">
          {PAYMENT_METHOD_LABELS[tx.payment_method]}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {isDeleting ? (
            <Spinner className="size-3.5" />
          ) : (
            <Trash01 size={14} />
          )}
        </button>
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAddClick }: { onAddClick?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center rounded-xl border bg-card">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted">
        <Receipt size={20} className="text-muted-foreground" />
      </div>
      <p className="text-xs sm:text-13 font-medium">No transactions found</p>
      <p className="mt-1 text-11 sm:text-xs text-muted-foreground max-w-xs">
        Try adjusting your filters or add a new expense.
      </p>
      {onAddClick && (
        <Button size="sm" className="mt-4 sm:mt-5 gap-1.5" onClick={onAddClick}>
          <Plus size={15} />
          Add expense
        </Button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: badge placeholders */}
      <div className="sm:hidden flex items-center gap-1.5">
        {[48, 40, 36, 40].map((w, i) => (
          <Skeleton key={i} className="h-6 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Mobile card skeletons */}
      <div className="sm:hidden flex flex-col gap-3">
        {[3, 2].map((count, gi) => (
          <div key={gi} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-0.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
            <div className="flex flex-col gap-1">
              {[...Array(count)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-card"
                >
                  <Skeleton className="size-9 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3 w-28 rounded" />
                      <Skeleton className="h-3 w-16 rounded shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-2.5 w-16 rounded" />
                      <Skeleton className="h-2.5 w-12 rounded" />
                    </div>
                  </div>
                  <Skeleton className="size-7 rounded-md shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden sm:block overflow-hidden rounded-xl border">
        <table className="w-full text-xs sm:text-13">
          <thead>
            <tr className="border-b bg-muted/40">
              {[...Array(5)].map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-2.5 w-14 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 rounded-lg shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-32 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-3 w-20 rounded" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="ml-auto h-3.5 w-16 rounded" />
                </td>
                <td className="hidden md:table-cell px-4 py-3.5">
                  <Skeleton className="h-3 w-16 rounded" />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="ml-auto size-7 rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
