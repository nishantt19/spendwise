"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash01 } from "@untitledui/icons";

import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PAYMENT_METHOD_LABELS } from "@/schema/transactions";
import { formatCurrency } from "@/lib/format";
import { softDeleteTransaction } from "@/actions/transactions";
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

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? "none" : "auto" }}
    >
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Description</th>
              <th className="px-4 py-2.5 text-left font-medium">Category</th>
              <th className="px-4 py-2.5 text-left font-medium">Amount</th>
              <th className="px-4 py-2.5 text-left font-medium">Method</th>
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
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
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Showing {transactions.length} of {total} transaction
        {total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

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
  const icon = cat?.icon ?? "💸";
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

  const formattedDate = new Date(tx.date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => onRowClick(tx)}
    >
      {/* Description */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-sm"
            style={{ backgroundColor: `${color}1a`, border: `1px solid ${color}30` }}
          >
            {icon}
          </div>
          <span className="max-w-50 truncate font-medium">{tx.description}</span>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3 text-muted-foreground">
        {cat?.name ?? "Uncategorized"}
      </td>

      {/* Amount */}
      <td className="px-4 py-3 font-semibold tabular-nums text-destructive">
        −{formatCurrency(tx.amount)}
      </td>

      {/* Method */}
      <td className="px-4 py-3 text-muted-foreground">
        {PAYMENT_METHOD_LABELS[tx.payment_method]}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-muted-foreground">{formattedDate}</td>

      {/* Actions */}
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {isDeleting ? <Spinner className="size-3.5" /> : <Trash01 size={14} />}
        </button>
      </td>
    </tr>
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
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {["Description", "Category", "Amount", "Method", "Date", "Actions"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left">
                <Skeleton className="h-3 w-16 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {[...Array(6)].map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-7 rounded-md" />
                  <Skeleton className="h-3.5 w-32 rounded" />
                </div>
              </td>
              <td className="px-4 py-3"><Skeleton className="h-3 w-20 rounded" /></td>
              <td className="px-4 py-3"><Skeleton className="h-3 w-16 rounded" /></td>
              <td className="px-4 py-3"><Skeleton className="h-3 w-16 rounded" /></td>
              <td className="px-4 py-3"><Skeleton className="h-3 w-20 rounded" /></td>
              <td className="px-4 py-3 text-right"><Skeleton className="ml-auto size-7 rounded-md" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
