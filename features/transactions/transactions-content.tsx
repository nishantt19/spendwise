"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { getTransactions } from "@/actions/transactions";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/format";
import { MONTH_LABELS } from "@/schema/income-sources";
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
  initialMonth: number;
  initialYear: number;
};

const EMPTY_FILTERS: FilterState = {
  search: "",
  categoryId: "",
  paymentMethod: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthDateRange(month: number, year: number) {
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    date_from: `${year}-${mm}-01`,
    date_to: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionsContent({
  initialTransactions,
  initialTotal,
  categories,
  initialMonth,
  initialYear,
}: TransactionsContentProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

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

  // Build the Supabase filter object — always locked to expense type + current month
  const activeFilters = useMemo<TransactionFilters>(
    () => ({
      type: "expense",
      search: debouncedSearch || undefined,
      category_id: filters.categoryId || undefined,
      payment_method: (filters.paymentMethod || undefined) as
        | TransactionFilters["payment_method"]
        | undefined,
      ...monthDateRange(month, year),
    }),
    [debouncedSearch, filters.categoryId, filters.paymentMethod, month, year],
  );

  // Skip the very first run — initial data from the server already matches the filters.
  // Only re-fetch when the user actually changes month, search, or filter values.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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

  // Re-fetch after any mutation (create / update / delete)
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

  // Count of non-empty filter fields (excludes month/year which are always active)
  const activeFilterCount = useMemo(
    () => [filters.categoryId, filters.paymentMethod].filter(Boolean).length,
    [filters],
  );

  // Monthly total amount from loaded transactions
  const monthlyAmount = useMemo(
    () => transactions.reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );

  // ── Month navigation ──────────────────────────────────────────────

  function goToPrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

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
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* ── Heading + month navigator ─────────────────────────────── */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Expenses
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {total > 0
              ? `${formatCurrency(monthlyAmount)} spent · ${total} expense${total !== 1 ? "s" : ""}`
              : `No expenses in ${MONTH_LABELS[month - 1]} ${year}`}
          </p>

          {/* Month navigator */}
          <div className="mt-3 flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-muted"
              disabled={isPending}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex min-w-24 sm:min-w-36 items-center justify-center">
              {isPending ? (
                <Spinner />
              ) : (
                <span className="text-xs sm:text-error md:text-sm font-semibold">
                  {MONTH_LABELS[month - 1]} {year}
                </span>
              )}
            </div>
            <button
              onClick={goToNextMonth}
              className="flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-muted"
              disabled={isPending}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

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
