"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Briefcase01,
  Laptop01,
  Building07,
  TrendUp01,
  Home01,
  Gift01,
  CreditCard02,
  Wallet02,
  ChevronLeft,
  ChevronRight,
  CalendarDate,
  Plus,
  Trash01,
  CoinsHand,
} from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { TypographyH2 } from "@/components/ui/typography";

import { formatCurrency, formatAmount, APP_LOCALE } from "@/lib/format";
import {
  INCOME_SOURCE_TYPE_LABELS,
  INCOME_SOURCE_TYPE_COLORS,
  MONTH_LABELS,
} from "@/schema/income-sources";
import {
  getIncomeSources,
  toggleIncomeReceived,
  deleteIncomeSource,
} from "@/actions/income-sources";
import { IncomeSourceSheet } from "./income-source-sheet";
import type { IncomeSource, IncomeSourceType } from "@/types/income-sources";

// ─── Icon map per source type ─────────────────────────────────────────────────

const TYPE_ICONS: Record<IncomeSourceType, React.ElementType> = {
  salary: Briefcase01,
  freelance: Laptop01,
  business: Building07,
  investment: TrendUp01,
  rental: Home01,
  gift: Gift01,
  credit_card: CreditCard02,
  other: Wallet02,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type IncomeContentProps = {
  initialSources: IncomeSource[];
  initialMonth: number;
  initialYear: number;
};

// ─── Root component ───────────────────────────────────────────────────────────

export function IncomeContent({
  initialSources,
  initialMonth,
  initialYear,
}: IncomeContentProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [sources, setSources] = useState<IncomeSource[]>(initialSources);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<IncomeSource | null>(
    null,
  );
  const [isFetching, startFetchTransition] = useTransition();

  function fetchMonth(newMonth: number, newYear: number) {
    setMonth(newMonth);
    setYear(newYear);
    startFetchTransition(async () => {
      const result = await getIncomeSources(newMonth, newYear);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSources(result.data);
    });
  }

  function goToPrevMonth() {
    if (month === 1) fetchMonth(12, year - 1);
    else fetchMonth(month - 1, year);
  }

  function goToNextMonth() {
    if (month === 12) fetchMonth(1, year + 1);
    else fetchMonth(month + 1, year);
  }

  function handleToggleReceived(id: string, newValue: boolean) {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_received: newValue } : s)),
    );
  }

  const handleRefresh = useCallback(() => {
    startFetchTransition(async () => {
      const result = await getIncomeSources(month, year);
      if (!result.error) setSources(result.data);
    });
  }, [month, year]);

  function openCreateSheet() {
    setSelectedSource(null);
    setSheetOpen(true);
  }

  function openEditSheet(source: IncomeSource) {
    setSelectedSource(source);
    setSheetOpen(true);
  }

  function handleDeleteSource(source: IncomeSource) {
    startFetchTransition(async () => {
      const result = await deleteIncomeSource(source.id);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSources((prev) => prev.filter((s) => s.id !== source.id));
    });
  }

  // ── Summary ────────────────────────────────────────────────────────
  const totalExpected = sources.reduce((sum, s) => sum + s.amount, 0);
  const totalReceived = sources
    .filter((s) => s.is_received)
    .reduce((sum, s) => sum + s.amount, 0);
  const totalPending = totalExpected - totalReceived;
  const pct =
    totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;
  const receivedCount = sources.filter((s) => s.is_received).length;
  const pendingCount = sources.length - receivedCount;

  const listStyle = {
    opacity: isFetching ? 0.5 : 1,
    pointerEvents: isFetching ? ("none" as const) : ("auto" as const),
    transition: "opacity 0.2s",
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* ── Heading ───────────────────────────────────────────────── */}
        <div>
          <TypographyH2>Income</TypographyH2>
          <div className="mt-0.5 text-xs sm:text-13 text-muted-foreground">
            <span className="sm:hidden">
              {MONTH_LABELS[month - 1]} {year}
              {totalExpected > 0 && ` · ${pct}% received`}
            </span>
            <span className="hidden sm:inline-flex sm:items-center sm:gap-1.5">
              {MONTH_LABELS[month - 1]} {year} · Track expected vs received
              {totalExpected > 0 && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-11 font-medium"
                  style={{
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                  }}
                >
                  {pct}% received
                </span>
              )}
            </span>
          </div>
        </div>

        {/* ── Month navigator ───────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center h-8 sm:h-9 rounded-md border bg-card overflow-hidden">
            <button
              onClick={goToPrevMonth}
              disabled={isFetching}
              className="flex h-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 text-xs font-medium min-w-28 sm:min-w-32 justify-center">
              <CalendarDate
                size={13}
                className="text-muted-foreground shrink-0"
              />
              {isFetching ? (
                <Spinner className="size-3.5" />
              ) : (
                <span className="tabular-nums">
                  {MONTH_LABELS[month - 1]} {year}
                </span>
              )}
            </div>
            <button
              onClick={goToNextMonth}
              disabled={isFetching}
              className="flex h-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <Button
            size="sm"
            onClick={openCreateSheet}
            className="shrink-0 gap-1.5"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add source</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Month progress card + stat cards ──────────────────────── */}
        {sources.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Progress card — spans 2 cols on sm+ */}
            <div
              className="sm:col-span-2 rounded-xl border p-4 sm:p-5 shadow-card"
              style={{
                background: "linear-gradient(160deg, var(--stat-accent-start), var(--card) 70%)",
                borderColor: "var(--stat-accent-border)",
              }}
            >
              {/* ── Desktop layout ── */}
              <div className="hidden sm:block">
                <p className="text-13 font-semibold">Month progress</p>
                <p className="text-11 text-muted-foreground mt-0.5 mb-4">
                  {MONTH_LABELS[month - 1]} {year}
                  {totalExpected > 0 && ` · ${pct}% received`}
                </p>

                {/* Amount row */}
                <div className="flex items-end justify-between mb-3">
                  <div className="flex items-end gap-0.5">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <span className="text-2xl font-semibold tabular-nums tracking-tight leading-none">
                      {formatAmount(totalReceived)}
                    </span>
                  </div>
                  <p className="text-11 text-muted-foreground self-start">
                    of {formatCurrency(totalExpected)} expected
                  </p>
                </div>

                {/* Progress bar */}
                <ProgressBar
                  received={totalReceived}
                  expected={totalExpected}
                  pending={totalPending}
                />

                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 text-11 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-sm inline-block"
                      style={{ background: "var(--primary)" }}
                    />
                    Received
                  </span>
                  {totalPending > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-sm inline-block"
                        style={{ background: "var(--warning)" }}
                      />
                      Pending
                    </span>
                  )}
                  <span className="ml-auto">
                    {sources.length} source{sources.length !== 1 ? "s" : ""}{" "}
                    tracked
                  </span>
                </div>
              </div>

              {/* ── Mobile layout ── */}
              <div className="sm:hidden">
                <p className="text-11 text-muted-foreground">
                  Received this month
                </p>

                <div className="flex items-end gap-0.5 mt-1">
                  <span className="text-xs text-muted-foreground">₹</span>
                  <span className="text-2xl font-semibold tabular-nums tracking-tight leading-none">
                    {formatAmount(totalReceived)}
                  </span>
                </div>

                <p className="text-11 text-muted-foreground mt-1.5">
                  of {formatCurrency(totalExpected)} expected
                </p>

                {/* Progress bar */}
                <div className="mt-3">
                  <ProgressBar
                    received={totalReceived}
                    expected={totalExpected}
                    pending={totalPending}
                  />
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-2 text-11 text-muted-foreground">
                  <span>
                    Received{" "}
                    <span
                      className="font-medium"
                      style={{ color: "var(--success)" }}
                    >
                      {formatCurrency(totalReceived)}
                    </span>
                  </span>
                  {totalPending > 0 && (
                    <span>
                      Pending{" "}
                      <span
                        className="font-medium"
                        style={{ color: "var(--warning)" }}
                      >
                        {formatCurrency(totalPending)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Source mix */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-card">
              <p className="text-xs sm:text-13 font-semibold mb-0.5">
                Source mix
              </p>
              <p className="text-11 text-muted-foreground mb-3">
                % of monthly income
              </p>
              <div className="flex flex-col gap-3">
                {sources
                  .filter((s) => s.amount > 0)
                  .slice(0, 4)
                  .map((s, i) => {
                    const pct =
                      totalExpected > 0
                        ? Math.round((s.amount / totalExpected) * 100)
                        : 0;
                    const barColors = [
                      "var(--chart-2)",
                      "var(--warning)",
                      "var(--info)",
                      "var(--chart-4)",
                    ];
                    const c = barColors[i % barColors.length];
                    return (
                      <div key={s.id}>
                        <div className="flex items-center justify-between text-11 sm:text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span
                              className="size-2 rounded-sm inline-block"
                              style={{ background: c }}
                            />
                            {s.name}
                          </span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatCurrency(s.amount)} · {pct}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--muted)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: c }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ── Source list ───────────────────────────────────────────── */}
        {sources.length === 0 ? (
          <EmptyState
            month={MONTH_LABELS[month - 1]}
            year={year}
            onAddClick={openCreateSheet}
          />
        ) : (
          <>
            {/* Mobile: "Income sources" heading */}
            <p className="sm:hidden text-xs font-semibold tracking-tight px-0.5">
              Income sources
            </p>

            {/* Mobile: card list (hidden on sm+) */}
            <div className="sm:hidden flex flex-col gap-1" style={listStyle}>
              {sources.map((source) => (
                <IncomeSourceCard
                  key={source.id}
                  source={source}
                  onCardClick={openEditSheet}
                />
              ))}
            </div>

            {/* Tablet/Desktop: table (hidden on mobile) */}
            <div
              className="hidden sm:block overflow-hidden rounded-xl border bg-card"
              style={listStyle}
            >
              {/* Card header */}
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between border-b">
                <div>
                  <p className="text-13 font-semibold">Income sources</p>
                  <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
                    {sources.length} source{sources.length !== 1 ? "s" : ""} ·{" "}
                    {receivedCount} received · {pendingCount} pending
                  </p>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted light:bg-muted/50 text-10 font-medium uppercase tracking-[0.08em] text-subtle-foreground">
                    <th className="px-4 py-2.5 text-left">Source</th>
                    <th className="px-4 py-2.5 text-left">Type</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="hidden md:table-cell px-4 py-2.5 text-left">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="w-10 px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <IncomeSourceRow
                      key={source.id}
                      source={source}
                      onRowClick={openEditSheet}
                      onToggleSuccess={handleToggleReceived}
                      onDelete={handleDeleteSource}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Dialog ──────────────────────────────────────────────────────── */}
      <IncomeSourceSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        source={selectedSource}
        defaultMonth={month}
        defaultYear={year}
        onSuccess={handleRefresh}
      />
    </>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  received,
  expected,
  pending,
}: {
  received: number;
  expected: number;
  pending: number;
}) {
  return (
    <div
      className="h-2.5 rounded-full flex overflow-hidden"
      style={{ background: "var(--muted)" }}
    >
      {expected > 0 && (
        <>
          <div
            className="h-full rounded-l-full transition-all"
            style={{
              width: `${Math.min(100, (received / expected) * 100)}%`,
              background: "var(--primary)",
            }}
          />
          {pending > 0 && (
            <div
              className="h-full"
              style={{
                width: `${Math.min(100 - (received / expected) * 100, (pending / expected) * 100)}%`,
                background: "var(--warning)",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Mobile income source card ────────────────────────────────────────────────

function IncomeSourceCard({
  source,
  onCardClick,
}: {
  source: IncomeSource;
  onCardClick: (source: IncomeSource) => void;
}) {
  const Icon = TYPE_ICONS[source.source_type];
  const color = INCOME_SOURCE_TYPE_COLORS[source.source_type];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer rounded-xl border bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors"
      onClick={() => onCardClick(source)}
    >
      {/* Icon */}
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${color}18`, color }}
      >
        <Icon size={16} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{source.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {/* Type badge */}
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-10 font-medium"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            {INCOME_SOURCE_TYPE_LABELS[source.source_type]}
          </span>
          {/* Status badge */}
          {source.is_received ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-10 font-medium"
              style={{
                background:
                  "color-mix(in oklch, var(--success) 12%, transparent)",
                color: "var(--success)",
              }}
            >
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ background: "var(--success)" }}
              />
              Received
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-10 font-medium"
              style={{
                background: "var(--warning-soft)",
                color: "var(--warning)",
              }}
            >
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ background: "var(--warning)" }}
              />
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Amount — sibling so it centers with the icon */}
      <span
        className="flex items-center gap-0.5 text-sm font-semibold tabular-nums shrink-0"
        style={{ color: "var(--success)" }}
      >
        <Plus size={12} strokeWidth={2.5} />
        {formatCurrency(source.amount)}
      </span>
    </div>
  );
}

// ─── Desktop income source row ────────────────────────────────────────────────

function IncomeSourceRow({
  source,
  onRowClick,
  onToggleSuccess,
  onDelete,
}: {
  source: IncomeSource;
  onRowClick: (source: IncomeSource) => void;
  onToggleSuccess: (id: string, newValue: boolean) => void;
  onDelete: (source: IncomeSource) => void;
}) {
  const [optimisticReceived, setOptimisticReceived] = useOptimistic(
    source.is_received,
  );
  const [, startToggleTransition] = useTransition();
  const Icon = TYPE_ICONS[source.source_type];
  const color = INCOME_SOURCE_TYPE_COLORS[source.source_type];

  function handleToggle() {
    const next = !optimisticReceived;
    startToggleTransition(async () => {
      setOptimisticReceived(next);
      const result = await toggleIncomeReceived(source.id, next);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        onToggleSuccess(source.id, next);
      }
    });
  }

  return (
    <tr
      className="group cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/30"
      onClick={() => onRowClick(source)}
    >
      {/* Name */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${color}18`, color }}
          >
            <Icon size={15} style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-13 font-medium max-w-36 sm:max-w-48">
              {source.name}
            </p>
            <p className="text-11 text-muted-foreground mt-0.5">
              {INCOME_SOURCE_TYPE_LABELS[source.source_type]}
            </p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-medium"
          style={{
            background: `color-mix(in oklch, ${color} 14%, var(--muted))`,
            color,
          }}
        >
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ background: color }}
          />
          {INCOME_SOURCE_TYPE_LABELS[source.source_type]}
        </span>
      </td>

      {/* Status — clickable toggle */}
      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleToggle}
          className="transition-opacity hover:opacity-80"
        >
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-medium"
            style={
              optimisticReceived
                ? { background: "var(--primary-soft)", color: "var(--primary)" }
                : { background: "var(--warning-soft)", color: "var(--warning)" }
            }
          >
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{
                background: optimisticReceived
                  ? "var(--primary)"
                  : "var(--warning)",
              }}
            />
            {optimisticReceived ? "Received" : "Pending"}
          </span>
        </button>
      </td>

      {/* Date */}
      <td className="hidden md:table-cell px-4 py-3.5 text-xs text-muted-foreground">
        {optimisticReceived && source.received_at ? (
          new Date(source.received_at).toLocaleDateString(APP_LOCALE, {
            month: "short",
            year: "numeric",
          })
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>

      {/* Amount */}
      <td
        className="px-4 py-3.5 text-right"
        style={{ color: "var(--success)" }}
      >
        <span className="inline-flex items-center justify-end gap-0.5 text-sm font-semibold tabular-nums">
          <Plus size={12} strokeWidth={2.5} />
          {formatCurrency(source.amount)}
        </span>
      </td>

      {/* Actions */}
      <td
        className="px-4 py-3.5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onDelete(source)}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash01 size={14} />
        </button>
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  month,
  year,
  onAddClick,
}: {
  month: string;
  year: number;
  onAddClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center rounded-xl border bg-card">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted">
        <CoinsHand size={20} className="text-muted-foreground" />
      </div>
      <p className="text-xs sm:text-13 font-medium">
        No income for {month} {year}
      </p>
      <p className="mt-1 text-11 sm:text-xs text-muted-foreground max-w-xs">
        Track the income you expect to receive this month.
      </p>
      <Button size="sm" className="mt-5 gap-1.5" onClick={onAddClick}>
        <Plus size={15} />
        Add source
      </Button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function IncomeContentSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Heading skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-24 rounded" />
        <Skeleton className="h-3.5 w-56 rounded" />
      </div>

      {/* Month nav skeleton */}
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-8 sm:h-9 w-36 rounded-md" />
        <Skeleton className="h-8 sm:h-9 w-24 rounded-lg" />
      </div>

      {/* Progress card skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="sm:col-span-2 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-7 w-32 rounded mb-2" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
        <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
          <Skeleton className="h-3.5 w-20 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-20 rounded" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile card skeletons */}
      <div className="sm:hidden overflow-hidden rounded-xl border divide-y">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded shrink-0" />
              </div>
              <Skeleton className="h-2.5 w-14 rounded" />
            </div>
            <Skeleton className="size-7 rounded-md shrink-0" />
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
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 rounded-lg shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-28 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-3 w-16 rounded" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="size-1.5 rounded-full" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton className="ml-auto h-3.5 w-20 rounded" />
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
