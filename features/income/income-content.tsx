"use client";

import { useCallback, useState, useTransition } from "react";
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
  Plus,
  Trash01,
} from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { formatCurrency } from "@/lib/format";
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

  function handleToggleReceived(source: IncomeSource) {
    const next = !source.is_received;
    setSources((prev) =>
      prev.map((s) => (s.id === source.id ? { ...s, is_received: next } : s)),
    );
    startFetchTransition(async () => {
      const result = await toggleIncomeReceived(source.id, next);
      if (result.status === "error") {
        toast.error(result.message);
        setSources((prev) =>
          prev.map((s) =>
            s.id === source.id ? { ...s, is_received: !next } : s,
          ),
        );
      }
    });
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

  const listStyle = {
    opacity: isFetching ? 0.5 : 1,
    pointerEvents: isFetching ? ("none" as const) : ("auto" as const),
    transition: "opacity 0.2s",
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* ── Month navigator ───────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-muted"
              disabled={isFetching}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex min-w-24 sm:min-w-36 items-center justify-center">
              {isFetching ? (
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
              disabled={isFetching}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Button
            size="default"
            onClick={openCreateSheet}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add source</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Summary cards ─────────────────────────────────────────── */}
        {sources.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <SummaryCard
              label="Expected"
              value={formatCurrency(totalExpected)}
              variant="default"
            />
            <SummaryCard
              label="Received"
              value={formatCurrency(totalReceived)}
              variant="success"
            />
            <SummaryCard
              label="Pending"
              value={formatCurrency(totalPending)}
              variant={totalPending > 0 ? "pending" : "default"}
            />
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
            {/* Mobile: card list (hidden on sm+) */}
            <div
              className="sm:hidden overflow-hidden rounded-xl border divide-y"
              style={listStyle}
            >
              {sources.map((source) => (
                <IncomeSourceCard
                  key={source.id}
                  source={source}
                  onCardClick={openEditSheet}
                  onToggleReceived={handleToggleReceived}
                  onDelete={handleDeleteSource}
                />
              ))}
            </div>

            {/* Tablet/Desktop: table (hidden on mobile) */}
            <div
              className="hidden sm:block overflow-hidden rounded-xl border"
              style={listStyle}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60 text-1.5xs sm:text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                      Name
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                      Type
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left font-medium">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-right font-medium">
                      Amount
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sources.map((source) => (
                    <IncomeSourceRow
                      key={source.id}
                      source={source}
                      onRowClick={openEditSheet}
                      onToggleReceived={handleToggleReceived}
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
    <div className="flex flex-col gap-0.5 sm:gap-1 rounded-xl border bg-card p-3 sm:p-4">
      <p className="text-[10px] sm:text-1.5xs md:text-xs text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-sm sm:text-base md:text-lg font-semibold tabular-nums truncate",
          valueClass,
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Mobile income source card ────────────────────────────────────────────────

function IncomeSourceCard({
  source,
  onCardClick,
  onToggleReceived,
  onDelete,
}: {
  source: IncomeSource;
  onCardClick: (source: IncomeSource) => void;
  onToggleReceived: (source: IncomeSource) => void;
  onDelete: (source: IncomeSource) => void;
}) {
  const Icon = TYPE_ICONS[source.source_type];
  const color = INCOME_SOURCE_TYPE_COLORS[source.source_type];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors"
      onClick={() => onCardClick(source)}
    >
      {/* Icon */}
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${color}1a`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon size={14} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate">{source.name}</span>
          <span className="text-xs font-semibold tabular-nums shrink-0">
            {formatCurrency(source.amount)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {INCOME_SOURCE_TYPE_LABELS[source.source_type]}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleReceived(source);
            }}
          >
            <Badge
              variant={source.is_received ? "default" : "secondary"}
              className={cn(
                "text-[10px] h-4 px-1.5 transition-colors",
                source.is_received
                  ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-700"
                  : "hover:bg-muted",
              )}
            >
              {source.is_received ? "Received" : "Pending"}
            </Badge>
          </button>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(source);
        }}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash01 size={13} />
      </button>
    </div>
  );
}

// ─── Desktop income source row ────────────────────────────────────────────────

function IncomeSourceRow({
  source,
  onRowClick,
  onToggleReceived,
  onDelete,
}: {
  source: IncomeSource;
  onRowClick: (source: IncomeSource) => void;
  onToggleReceived: (source: IncomeSource) => void;
  onDelete: (source: IncomeSource) => void;
}) {
  const Icon = TYPE_ICONS[source.source_type];
  const color = INCOME_SOURCE_TYPE_COLORS[source.source_type];

  return (
    <tr
      className="group cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/40"
      onClick={() => onRowClick(source)}
    >
      {/* Name */}
      <td className="px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md"
            style={{
              backgroundColor: `${color}1a`,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <span className="max-w-28 sm:max-w-40 md:max-w-52 truncate font-medium text-error sm:text-sm">
            {source.name}
          </span>
        </div>
      </td>

      {/* Type */}
      <td className="px-3 sm:px-4 py-3">
        <span className="rounded-md bg-muted px-2 py-0.5 text-1.5xs sm:text-xs text-muted-foreground font-medium">
          {INCOME_SOURCE_TYPE_LABELS[source.source_type]}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 sm:px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onToggleReceived(source)}>
          <Badge
            variant={source.is_received ? "default" : "secondary"}
            className={cn(
              "text-1.5xs transition-colors",
              source.is_received
                ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-700"
                : "hover:bg-muted",
            )}
          >
            {source.is_received ? "Received" : "Pending"}
          </Badge>
        </button>
      </td>

      {/* Amount — right-aligned */}
      <td className="px-3 sm:px-4 py-3 text-right text-error sm:text-sm font-semibold tabular-nums text-foreground">
        {formatCurrency(source.amount)}
      </td>

      {/* Actions */}
      <td
        className="px-3 sm:px-4 py-3 text-right"
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
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="mb-3 flex size-12 sm:size-14 items-center justify-center rounded-full bg-muted">
        <span className="text-xl sm:text-2xl">💰</span>
      </div>
      <p className="text-xs sm:text-sm font-medium">
        No income sources for {month} {year}
      </p>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
        Add the income you expect to receive this month.
      </p>
      <Button size="sm" className="mt-5" onClick={onAddClick}>
        <span className="flex items-center justify-center gap-1.5">
          <Plus size={15} />
          Add source
        </span>
      </Button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function IncomeContentSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40 sm:w-48 rounded-md" />
        <Skeleton className="h-8 w-16 sm:w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-xl border p-3 sm:p-4"
          >
            <Skeleton className="h-2.5 w-14 rounded" />
            <Skeleton className="h-5 sm:h-6 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Mobile card skeletons */}
      <div className="sm:hidden overflow-hidden rounded-xl border divide-y">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-14 rounded" />
                <Skeleton className="h-4 w-14 rounded-full" />
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
              {["Name", "Type", "Status", "Amount", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left">
                  <Skeleton className="h-2.5 w-10 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-7 rounded-md shrink-0" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="ml-auto h-3.5 w-16 rounded" />
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
