"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash01 } from "@untitledui/icons";

import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PAYMENT_METHOD_LABELS } from "@/schema/transactions";
import { formatCurrency } from "@/lib/format";
import { softDeleteTransaction } from "@/actions/transactions";
import { CategoryIcon } from "@/lib/category-icons";
import type { TransactionWithCategory } from "@/types/transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionsListProps = {
  transactions: TransactionWithCategory[];
  total: number;
  isPending: boolean;
  onRowClick: (transaction: TransactionWithCategory) => void;
  onDelete: () => void;
};

// ─── Root component ───────────────────────────────────────────────────────────

export function TransactionsList({
  transactions,
  total,
  isPending,
  onRowClick,
  onDelete,
}: TransactionsListProps) {
  if (isPending && transactions.length === 0) {
    return <TransactionsSkeleton />;
  }

  if (!isPending && transactions.length === 0) {
    return <EmptyState />;
  }

  const listStyle = {
    opacity: isPending ? 0.5 : 1,
    pointerEvents: isPending ? ("none" as const) : ("auto" as const),
    transition: "opacity 0.2s",
  };

  return (
    <div style={listStyle}>
      {/* Mobile: card list (hidden on sm+) */}
      <div className="sm:hidden overflow-hidden rounded-xl border divide-y">
        {transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            onCardClick={onRowClick}
            onDeleteSuccess={onDelete}
          />
        ))}
      </div>

      {/* Tablet/Desktop: table (hidden on mobile) */}
      <div className="hidden sm:block overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-1.5xs sm:text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                Description
              </th>
              <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                Category
              </th>
              <th className="px-3 sm:px-4 py-2.5 text-right font-medium">
                Amount
              </th>
              <th className="hidden md:table-cell px-4 py-2.5 text-left font-medium">
                Method
              </th>
              <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                Date
              </th>
              <th className="px-3 sm:px-4 py-2.5 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onRowClick={onRowClick}
                onDeleteSuccess={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <p className="mt-3 text-center text-[10px] sm:text-xs text-muted-foreground">
        Showing {transactions.length} of {total} transaction
        {total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Mobile transaction card ──────────────────────────────────────────────────

function TransactionCard({
  transaction: tx,
  onCardClick,
  onDeleteSuccess,
}: {
  transaction: TransactionWithCategory;
  onCardClick: (transaction: TransactionWithCategory) => void;
  onDeleteSuccess: () => void;
}) {
  const cat = tx.category;
  const color = cat?.color ?? "#6b7280";
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

  const formattedDate = new Date(tx.date + "T00:00:00").toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  );

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors"
      onClick={() => onCardClick(tx)}
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
          <span className="text-xs font-medium truncate">{tx.description}</span>
          <span className="text-xs font-semibold tabular-nums shrink-0 text-destructive">
            −{formatCurrency(tx.amount)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {cat?.name ?? "Uncategorized"}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        {isDeleting ? <Spinner className="size-3.5" /> : <Trash01 size={13} />}
      </button>
    </div>
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
  const cat = tx.category;
  const color = cat?.color ?? "#6b7280";
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

  const formattedDate = new Date(tx.date + "T00:00:00").toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <tr
      className="group cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/40"
      onClick={() => onRowClick(tx)}
    >
      {/* Description */}
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
          <span className="max-w-28 sm:max-w-40 md:max-w-52 truncate font-medium text-error sm:text-sm">
            {tx.description}
          </span>
        </div>
      </td>

      {/* Category — as pill */}
      <td className="px-3 sm:px-4 py-3">
        <span className="rounded-md bg-muted px-2 py-0.5 text-1.5xs sm:text-xs text-muted-foreground font-medium">
          {cat?.name ?? "Uncategorized"}
        </span>
      </td>

      {/* Amount — right-aligned, red */}
      <td className="px-3 sm:px-4 py-3 text-right text-error sm:text-sm font-semibold tabular-nums text-destructive">
        −{formatCurrency(tx.amount)}
      </td>

      {/* Method — hidden on sm, shown on md+ */}
      <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
        {PAYMENT_METHOD_LABELS[tx.payment_method]}
      </td>

      {/* Date */}
      <td className="px-3 sm:px-4 py-3 text-error sm:text-sm text-muted-foreground">
        {formattedDate}
      </td>

      {/* Actions — visible only on row hover */}
      <td
        className="px-3 sm:px-4 py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="mb-3 flex size-12 sm:size-14 items-center justify-center rounded-full bg-muted">
        <span className="text-xl sm:text-2xl">🧾</span>
      </div>
      <p className="text-xs sm:text-sm font-medium">No transactions found</p>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
        Try adjusting your filters or add a new expense.
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TransactionsSkeleton() {
  return (
    <div>
      {/* Mobile card skeletons */}
      <div className="sm:hidden overflow-hidden rounded-xl border divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8 rounded-lg shrink-0" />
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

      {/* Desktop table skeleton */}
      <div className="hidden sm:block overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60">
              {["Description", "Category", "Amount", "Date", "Actions"].map(
                (h) => (
                  <th key={h} className="px-4 py-2.5 text-left">
                    <Skeleton className="h-2.5 w-14 rounded" />
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-7 rounded-md shrink-0" />
                    <Skeleton className="h-3.5 w-32 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="ml-auto h-3.5 w-16 rounded" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-3 w-20 rounded" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="ml-auto size-7 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
