"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { PAYMENT_METHOD_LABELS } from "@/schema/transactions";
import { formatCurrency, formatDateHeader } from "@/lib/format";
import type { TransactionWithCategory } from "@/types/transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionsListProps = {
  transactions: TransactionWithCategory[];
  total: number;
  isPending: boolean;
  onRowClick: (transaction: TransactionWithCategory) => void;
};

// ─── Root component ───────────────────────────────────────────────────────────

export function TransactionsList({
  transactions,
  total,
  isPending,
  onRowClick,
}: TransactionsListProps) {
  if (isPending && transactions.length === 0) {
    return <TransactionsSkeleton />;
  }

  if (!isPending && transactions.length === 0) {
    return <EmptyState />;
  }

  // Group by date ("YYYY-MM-DD")
  const grouped = groupByDate(transactions);

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? "none" : "auto" }}
    >
      <div className="flex flex-col divide-y rounded-xl border">
        {Object.entries(grouped).map(([date, txs]) => (
          <DateGroup
            key={date}
            date={date}
            transactions={txs}
            onRowClick={onRowClick}
          />
        ))}
      </div>

      {/* Count */}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Showing {transactions.length} of {total} transaction
        {total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Date group ───────────────────────────────────────────────────────────────

function DateGroup({
  date,
  transactions,
  onRowClick,
}: {
  date: string;
  transactions: TransactionWithCategory[];
  onRowClick: (transaction: TransactionWithCategory) => void;
}) {
  const net = transactions.reduce((acc, tx) => {
    return tx.type === "income" ? acc + tx.amount : acc - tx.amount;
  }, 0);

  return (
    <div>
      {/* Date header */}
      <div className="flex items-center justify-between bg-muted/40 px-4 py-2">
        <span className="text-xs font-semibold text-foreground">
          {formatDateHeader(date)}
        </span>
        <span
          className={`text-xs font-medium ${
            net >= 0 ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {net >= 0 ? "+" : ""}
          {formatCurrency(net)}
        </span>
      </div>

      {/* Transactions */}
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} transaction={tx} onClick={onRowClick} />
      ))}
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TransactionRow({
  transaction: tx,
  onClick,
}: {
  transaction: TransactionWithCategory;
  onClick: (transaction: TransactionWithCategory) => void;
}) {
  const cat = tx.category;
  const color = cat?.color ?? "#6b7280";
  const icon = cat?.icon ?? (tx.type === "expense" ? "💸" : "💰");
  const isExpense = tx.type === "expense";

  return (
    <button
      onClick={() => onClick(tx)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      {/* Category icon */}
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
        style={{
          backgroundColor: `${color}1a`,
          border: `1px solid ${color}30`,
        }}
      >
        {icon}
      </div>

      {/* Description + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.description}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {cat?.name ?? "Uncategorized"}
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          {PAYMENT_METHOD_LABELS[tx.payment_method]}
        </p>
      </div>

      {/* Amount */}
      <p
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isExpense ? "text-destructive" : "text-emerald-600"
        }`}
      >
        {isExpense ? "−" : "+"}
        {formatCurrency(tx.amount)}
      </p>
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
        <span className="text-2xl">🧾</span>
      </div>
      <p className="text-sm font-medium">No transactions found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try adjusting your filters or add a new transaction.
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(
  transactions: TransactionWithCategory[],
): Record<string, TransactionWithCategory[]> {
  return transactions.reduce(
    (acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push(tx);
      return acc;
    },
    {} as Record<string, TransactionWithCategory[]>,
  );
}
