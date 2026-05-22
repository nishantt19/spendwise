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

import {
  CreditCard02,
  CalendarDate,
  Tag01,
  TrendUp01,
  TrendDown01,
} from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/ui/sparkline";
import { Spinner } from "@/components/ui/spinner";
import { TypographyH2 } from "@/components/ui/typography";

import {
  getTransactions,
  getMonthlyExpenseTotal,

} from "@/actions/transactions";
import { formatCurrency, formatAmount } from "@/lib/format";
import { MONTH_LABELS } from "@/schema/income-sources";
import {
  TransactionsFilters,
  type FilterState,
  type PaymentMethodTab,
} from "./transactions-filters";
import { TransactionsList } from "./transactions-list";
import { TransactionSheet } from "./transaction-sheet";

import type { Category } from "@/types/categories";
import type {
  TransactionFilters,
  TransactionWithCategory,
} from "@/types/transactions";
import { cn } from "@/lib/utils";

// ─── Daily spend bar chart ────────────────────────────────────────────────────

// ─── DailySpendChart constants ────────────────────────────────────────────────
const DAILY_CHART_SLOT_W = 30;  // px width allocated per day column
const DAILY_CHART_H = 70;       // total SVG height in px
const DAILY_CHART_BAR_MAX = 60; // max bar height (leaves 10px padding above)
const DAILY_LARGE_SPEND_THRESHOLD = 10_000; // INR — triggers warning colour

function DailySpendChart({
  data,
  month,
  year,
}: {
  data: number[];
  month: number;
  year: number;
}) {
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() + 1 === month && today.getFullYear() === year;
  const todayDay = today.getDate();
  const slotW = DAILY_CHART_SLOT_W;
  const chartH = DAILY_CHART_H;
  const barMax = DAILY_CHART_BAR_MAX;

  return (
    <svg
      viewBox={`0 0 ${data.length * slotW} ${chartH}`}
      width="100%"
      height={chartH}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      {data.map((v, i) => {
        const day = i + 1;
        const x = i * slotW + 2;
        const isFuture = isCurrentMonth && day > todayDay;
        const isEmpty = v === 0 || isFuture;
        const isLarge = v >= DAILY_LARGE_SPEND_THRESHOLD;
        return (
          <g key={i}>
            {/* Ghost line — no spend or future day */}
            {isEmpty && (
              <rect
                x={x + 4}
                y={chartH - 2}
                width={18}
                height={2}
                rx={1}
                fill="var(--muted-foreground)"
                opacity={0.18}
              />
            )}
            {/* Destructive line — normal spend (< 10K) */}
            {!isEmpty && !isLarge && (
              <rect
                x={x + 4}
                y={chartH - 2}
                width={18}
                height={2}
                rx={1}
                fill="var(--destructive)"
                opacity={0.85}
              />
            )}
            {/* Full-height warning bar — large spend (≥ 10K) */}
            {isLarge && (
              <rect
                x={x + 4}
                y={chartH - barMax}
                width={18}
                height={barMax}
                rx={3}
                fill="var(--warning)"
                opacity={0.85}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── MiniBarChart constants ───────────────────────────────────────────────────
const MINI_BAR_H = 24;   // SVG height in px
const MINI_BAR_W = 3;    // bar width in px
const MINI_BAR_GAP = 1;  // gap between bars in px

// ─── Mini bar chart (compact, top-right of daily avg card) ───────────────────

function MiniBarChart({
  data,
  color = "var(--info)",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const h = MINI_BAR_H;
  const barW = MINI_BAR_W;
  const gap = MINI_BAR_GAP;
  const w = data.length * (barW + gap) - gap;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      style={{ display: "block", flexShrink: 0 }}
    >
      {data.map((v, i) => {
        const barH = v === 0 ? 2 : Math.max(3, (v / max) * (h - 2));
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx={1}
            fill={color}
            opacity={v === 0 ? 0.25 : 0.8}
          />
        );
      })}
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionsContentProps = {
  initialTransactions: TransactionWithCategory[];
  initialTotal: number;
  categories: Category[];
  initialMonth: number;
  initialYear: number;
};

const EMPTY_FILTERS: FilterState = {
  paymentMethodTab: "all",
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

// Maps payment tab key → methods array for the server filter
const TAB_TO_METHODS: Record<string, TransactionFilters["payment_methods"]> = {
  card: ["credit_card", "debit_card"],
  upi: ["upi"],
  cash: ["cash"],
};

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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithCategory | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isMonthPending, startMonthTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [prevMonthTotal, setPrevMonthTotal] = useState(0);

  // Build the Supabase filter object — always locked to expense type + current month
  const activeFilters = useMemo<TransactionFilters>(
    () => ({
      type: "expense",
      payment_methods: TAB_TO_METHODS[filters.paymentMethodTab],
      ...monthDateRange(month, year),
    }),
    [filters.paymentMethodTab, month, year],
  );

  // Re-fetch when tab changes. Month changes do their own fetch via navigateMonth.
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
  }, [filters.paymentMethodTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch previous month total for delta badge
  useEffect(() => {
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    getMonthlyExpenseTotal(prevM, prevY).then(({ total }) =>
      setPrevMonthTotal(total),
    );
  }, [month, year]);



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

  // Monthly total amount from loaded transactions
  const monthlyAmount = useMemo(
    () => transactions.reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );

  // Stat hero computations
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyAvg = total > 0 ? monthlyAmount / daysInMonth : 0;

  const topCategory = useMemo(() => {
    if (transactions.length === 0) return null;
    const catMap = new Map<
      string,
      { name: string; amount: number; count: number }
    >();
    for (const tx of transactions) {
      const key = tx.category?.id ?? "__none__";
      const name = tx.category?.name ?? "Uncategorized";
      const cur = catMap.get(key);
      catMap.set(key, {
        name,
        amount: (cur?.amount ?? 0) + tx.amount,
        count: (cur?.count ?? 0) + 1,
      });
    }
    return [...catMap.values()].sort((a, b) => b.amount - a.amount)[0] ?? null;
  }, [transactions]);

  const largestTx = useMemo(
    () =>
      transactions.reduce<(typeof transactions)[0] | null>(
        (best, tx) => (!best || tx.amount > best.amount ? tx : best),
        null,
      ),
    [transactions],
  );

  // Daily spend data for bar chart
  const dailySpend = useMemo(() => {
    const map = new Map<number, number>();
    for (const tx of transactions) {
      const day = parseInt(tx.date.split("-")[2], 10);
      map.set(day, (map.get(day) ?? 0) + tx.amount);
    }
    return Array.from({ length: daysInMonth }, (_, i) => map.get(i + 1) ?? 0);
  }, [transactions, daysInMonth]);

  // Highest spending day
  const highestDayIdx = dailySpend.reduce(
    (maxI, v, i, arr) => (v > arr[maxI] ? i : maxI),
    0,
  );
  const highestDayAmount = dailySpend[highestDayIdx] ?? 0;
  const highestDayLabel =
    highestDayAmount > 0
      ? `${highestDayIdx + 1} ${MONTH_LABELS[month - 1].slice(0, 3)}`
      : null;

  // Largest tx date formatted as "15 May"
  const largestTxDateLabel = useMemo(() => {
    if (!largestTx) return null;
    const [, lm, ld] = largestTx.date.split("-").map(Number);
    return `${ld} ${MONTH_LABELS[lm - 1].slice(0, 3)}`;
  }, [largestTx]);

  // Delta vs previous month (positive = spent more, negative = spent less)
  const prevMonthName = MONTH_LABELS[month === 1 ? 11 : month - 2].slice(0, 3);
  const delta =
    prevMonthTotal > 0
      ? ((monthlyAmount - prevMonthTotal) / prevMonthTotal) * 100
      : null;

  // ── Month navigation — own transition so tab changes don't show the spinner ──

  function navigateMonth(newMonth: number, newYear: number) {
    setMonth(newMonth);
    setYear(newYear);
    setPage(1);
    startMonthTransition(async () => {
      const result = await getTransactions(
        {
          type: "expense",
          payment_methods: TAB_TO_METHODS[filters.paymentMethodTab],
          ...monthDateRange(newMonth, newYear),
        },
        1,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setTransactions(result.data);
      setTotal(result.total);
    });
  }

  function goToPrevMonth() {
    if (month === 1) navigateMonth(12, year - 1);
    else navigateMonth(month - 1, year);
  }

  function goToNextMonth() {
    if (month === 12) navigateMonth(1, year + 1);
    else navigateMonth(month + 1, year);
  }

  // ── Filter handler ────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: PaymentMethodTab) => {
    setFilters({ paymentMethodTab: tab });
  }, []);

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
        {/* ── Heading ───────────────────────────────────────────────── */}
        <div>
          <TypographyH2>Expenses</TypographyH2>
          <p className="mt-0.5 text-xs sm:text-13 text-muted-foreground">
            {total > 0
              ? `${MONTH_LABELS[month - 1]} ${year} · ${formatCurrency(monthlyAmount)} spent · ${total} expense${total !== 1 ? "s" : ""}`
              : `No expenses in ${MONTH_LABELS[month - 1]} ${year}`}
          </p>
        </div>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <TransactionsFilters
          filters={filters}
          month={month}
          year={year}
          isPending={isMonthPending}
          onFilterChange={handleTabChange}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onAddClick={openCreateSheet}
        />

        {/* ── Stat hero row ─────────────────────────────────────────── */}
        {total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total spent — full-width on mobile, accent gradient on all sizes */}
            <div
              className="col-span-2 sm:col-span-1 relative flex flex-col gap-2 rounded-xl border p-3 sm:p-3.5 shadow-card overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, var(--stat-accent-start), var(--card) 70%)",
                borderColor: "var(--stat-accent-border)",
              }}
            >
              {/* Corner sparkline — absolutely positioned top-right */}
              {dailySpend.some((v) => v > 0) && (
                <div className="absolute right-3 top-3 w-16 sm:w-17.5 opacity-85">
                  <Sparkline
                    data={dailySpend}
                    stroke="var(--primary)"
                    fill="var(--primary-soft)"
                    height={28}
                  />
                </div>
              )}
              <div className="flex items-center gap-1 min-w-0">
                <CreditCard02
                  size={12}
                  className="text-muted-foreground shrink-0"
                />
                <span className="text-11 sm:text-xs font-medium text-muted-foreground truncate">
                  Total spent
                </span>
              </div>
              <p className="leading-none tabular-nums tracking-[-0.03em] flex items-baseline gap-1">
                <span className="text-13 font-semibold text-muted-foreground tracking-normal">
                  ₹
                </span>
                <span className="text-2xl font-semibold">
                  {formatAmount(monthlyAmount)}
                </span>
              </p>
              <div className="mt-auto flex items-center gap-1.5 flex-wrap">
                {delta !== null && (
                  <>
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-10 font-semibold tabular-nums",
                        delta <= 0
                          ? "text-primary bg-primary-soft"
                          : "text-destructive bg-destructive-soft",
                      )}
                    >
                      {delta <= 0 ? (
                        <TrendDown01 size={10} />
                      ) : (
                        <TrendUp01 size={10} />
                      )}
                      {Math.abs(delta).toFixed(1)}%
                    </span>
                    <span className="text-10 text-muted-foreground">
                      vs ₹{formatAmount(prevMonthTotal)}{" "}
                      in {prevMonthName}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Daily average — hidden on mobile */}
            <div className="hidden sm:flex flex-col gap-2 rounded-xl border bg-card p-3 sm:p-3.5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <CalendarDate
                    size={12}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="text-11 sm:text-xs font-medium text-muted-foreground truncate">
                    Daily average
                  </span>
                </div>
                {dailySpend.some((v) => v > 0) && (
                  <div className="mt-0.5 shrink-0">
                    <MiniBarChart data={dailySpend} color="var(--info)" />
                  </div>
                )}
              </div>
              <p className="leading-none tabular-nums tracking-[-0.03em] flex items-baseline gap-1">
                <span className="text-13 font-semibold text-muted-foreground tracking-normal">
                  ₹
                </span>
                <span className="text-2xl font-semibold">
                  {formatAmount(dailyAvg)}
                </span>
              </p>
              <span className="mt-auto text-10 sm:text-11 text-muted-foreground">
                {highestDayAmount > 0 && highestDayLabel
                  ? `₹${formatAmount(highestDayAmount)} · ${highestDayLabel}`
                  : `${daysInMonth} days`}
              </span>
            </div>

            {/* Top category — hidden on mobile */}
            <div className="hidden sm:flex flex-col gap-2 rounded-xl border bg-card p-3 sm:p-3.5 shadow-card">
              <div className="flex items-center gap-1">
                <Tag01 size={12} className="text-muted-foreground shrink-0" />
                <span className="text-11 sm:text-xs font-medium text-muted-foreground truncate">
                  Top category
                </span>
              </div>
              {topCategory ? (
                <p className="leading-none tabular-nums tracking-[-0.03em] flex items-baseline gap-1">
                  <span className="text-13 font-semibold text-muted-foreground">
                    ₹
                  </span>
                  <span className="text-2xl font-semibold">
                    {formatAmount(topCategory.amount)}
                  </span>
                </p>
              ) : (
                <p className="text-2xl font-semibold leading-none">—</p>
              )}
              <span className="mt-auto text-10 sm:text-11 text-muted-foreground truncate">
                {topCategory
                  ? `${topCategory.name} · ${topCategory.count} transaction${topCategory.count !== 1 ? "s" : ""}`
                  : "No data"}
              </span>
            </div>

            {/* Largest single — hidden on mobile */}
            <div className="hidden sm:flex flex-col gap-2 rounded-xl border bg-card p-3 sm:p-3.5 shadow-card">
              <div className="flex items-center gap-1">
                <TrendUp01
                  size={12}
                  className="text-muted-foreground shrink-0"
                />
                <span className="text-11 sm:text-xs font-medium text-muted-foreground truncate">
                  Largest single
                </span>
              </div>
              <p className="leading-none tabular-nums tracking-[-0.03em] flex items-baseline gap-1">
                <span className="text-13 font-semibold text-muted-foreground tracking-normal">
                  ₹
                </span>
                <span className="text-2xl font-semibold">
                  {largestTx
                    ? formatAmount(largestTx.amount)
                    : "—"}
                </span>
              </p>
              <span className="mt-auto text-10 sm:text-11 text-muted-foreground truncate">
                {largestTx
                  ? `${largestTx.description}${largestTxDateLabel ? ` · ${largestTxDateLabel}` : ""}`
                  : "No data"}
              </span>
            </div>
          </div>
        )}

        {/* ── Daily spend bar chart — hidden on mobile ─────────────── */}
        {total > 0 && dailySpend.some((v) => v > 0) && (
          <div className="hidden sm:block rounded-xl border bg-card p-3 sm:p-4 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs sm:text-13 font-semibold">Daily spend pattern</p>
                <p className="text-11 text-muted-foreground mt-0.5">
                  {MONTH_LABELS[month - 1]} {year} · bars sized to daily total
                </p>
              </div>
              <div className="flex items-center gap-3 text-11 text-muted-foreground shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm inline-block bg-muted-foreground/30" />
                  None
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm inline-block bg-destructive/85" />
                  Spend
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm inline-block bg-warning/85" />
                  Large (≥₹{DAILY_LARGE_SPEND_THRESHOLD / 1000}K)
                </span>
              </div>
            </div>
            <DailySpendChart data={dailySpend} month={month} year={year} />
          </div>
        )}

        {/* List */}
        <TransactionsList
          transactions={transactions}
          total={total}
          isPending={isPending}
          activeTab={filters.paymentMethodTab}
          onTabChange={handleTabChange}
          onRowClick={openEditSheet}
          onDelete={handleRefresh}
          onAddClick={openCreateSheet}
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
