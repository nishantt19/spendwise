"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { getTransactions } from "@/actions/transactions";
import { useDebounce } from "@/hooks/use-debounce";
import { TransactionsFilters, type FilterState } from "./transactions-filters";
import { TransactionsList } from "./transactions-list";
import { TransactionSheet } from "./transaction-sheet";

import type { Category } from "@/types/categories";
import type {
  TransactionFilters,
  TransactionWithCategory,
} from "@/types/transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionsContentProps = {
  initialTransactions: TransactionWithCategory[];
  initialTotal: number;
  categories: Category[];
};

const EMPTY_FILTERS: FilterState = {
  search: "",
  categoryId: "",
  paymentMethod: "",
  dateFrom: "",
  dateTo: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionsContent({
  initialTransactions,
  initialTotal,
  categories,
}: TransactionsContentProps) {
  const [transactions, setTransactions] =
    useState<TransactionWithCategory[]>(initialTransactions);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithCategory | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build the Supabase filter object — always locked to expense type
  const activeFilters = useMemo<TransactionFilters>(
    () => ({
      type: "expense",
      search: debouncedSearch || undefined,
      category_id: filters.categoryId || undefined,
      payment_method: (filters.paymentMethod || undefined) as
        | TransactionFilters["payment_method"]
        | undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      debouncedSearch,
      filters.categoryId,
      filters.paymentMethod,
      filters.dateFrom,
      filters.dateTo,
    ],
  );

  // Re-fetch whenever active filters change; always reset to page 1
  useEffect(() => {
    setPage(1);
    startTransition(async () => {
      const result = await getTransactions(activeFilters, 1);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setTransactions(result.data);
      setTotal(result.total);
    });
  }, [activeFilters]);

  // Re-fetch after any mutation (create / update / delete) — updates list instantly
  const handleRefresh = useCallback(() => {
    setPage(1);
    startTransition(async () => {
      const result = await getTransactions(activeFilters, 1);
      if (!result.error) {
        setTransactions(result.data);
        setTotal(result.total);
      }
    });
  }, [activeFilters]);

  // Count of non-empty filter fields
  const activeFilterCount = useMemo(
    () =>
      [
        filters.categoryId,
        filters.paymentMethod,
        filters.dateFrom,
        filters.dateTo,
      ].filter(Boolean).length,
    [filters],
  );

  // ── Filter handlers ───────────────────────────────────────────────

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  function handleClearAll() {
    setFilters(EMPTY_FILTERS);
  }

  // ── Sheet handlers ────────────────────────────────────────────────

  function openCreateSheet() {
    setSelectedTransaction(null);
    setSheetOpen(true);
  }

  function openEditSheet(transaction: TransactionWithCategory) {
    setSelectedTransaction(transaction);
    setSheetOpen(true);
  }

  // ── Load more ─────────────────────────────────────────────────────

  async function handleLoadMore() {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const result = await getTransactions(activeFilters, nextPage);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setTransactions((prev) => [...prev, ...result.data]);
      setPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const hasMore = transactions.length < total;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Filters */}
        <TransactionsFilters
          filters={filters}
          categories={categories}
          activeFilterCount={activeFilterCount}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
          onAddClick={openCreateSheet}
        />

        {/* List */}
        <TransactionsList
          transactions={transactions}
          total={total}
          isPending={isPending}
          onRowClick={openEditSheet}
          onDelete={handleRefresh}
        />

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore || isPending}
            >
              <span className="flex items-center justify-center gap-1.5">
                {isLoadingMore ? <Spinner /> : ""}
                Load more
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Expense sheet */}
      <TransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        categories={categories}
        transaction={selectedTransaction}
        onSuccess={handleRefresh}
      />
    </>
  );
}
