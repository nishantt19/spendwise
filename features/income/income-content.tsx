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
import { getIncomeSources, toggleIncomeReceived, deleteIncomeSource } from "@/actions/income-sources";
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
  const [selectedSource, setSelectedSource] = useState<IncomeSource | null>(null);
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

  // Optimistic toggle: update local state immediately
  function handleToggleReceived(source: IncomeSource) {
    const next = !source.is_received;
    setSources((prev) =>
      prev.map((s) => (s.id === source.id ? { ...s, is_received: next } : s)),
    );
    startFetchTransition(async () => {
      const result = await toggleIncomeReceived(source.id, next);
      if (result.status === "error") {
        toast.error(result.message);
        // Revert on error
        setSources((prev) =>
          prev.map((s) =>
            s.id === source.id ? { ...s, is_received: !next } : s,
          ),
        );
      }
    });
  }

  // Re-fetch after any mutation — updates list instantly
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

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* ── Month navigator ───────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-muted"
              disabled={isFetching}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex min-w-36 items-center justify-center">
              {isFetching ? (
                <Spinner />
              ) : (
                <span className="text-sm font-semibold">
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

          <Button size="sm" onClick={openCreateSheet}>
            <span className="flex items-center justify-center gap-1.5">
              <Plus size={15} />
              Add source
            </span>
          </Button>
        </div>

        {/* ── Summary cards ─────────────────────────────────────────── */}
        {sources.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
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
          <div
            className="overflow-hidden rounded-xl border transition-opacity duration-200"
            style={{ opacity: isFetching ? 0.5 : 1, pointerEvents: isFetching ? "none" : "auto" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-left font-medium">Month</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
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
        )}
      </div>

      {/* ── Sheet ──────────────────────────────────────────────────────── */}
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
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Income source row ────────────────────────────────────────────────────────

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
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => onRowClick(source)}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}1a`, border: `1px solid ${color}30` }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <span className="max-w-44 truncate font-medium">{source.name}</span>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3 text-muted-foreground">
        {INCOME_SOURCE_TYPE_LABELS[source.source_type]}
      </td>

      {/* Status */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onToggleReceived(source)}>
          <Badge
            variant={source.is_received ? "default" : "secondary"}
            className={cn(
              "text-[11px] transition-colors",
              source.is_received
                ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-700"
                : "hover:bg-muted",
            )}
          >
            {source.is_received ? "Received" : "Pending"}
          </Badge>
        </button>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
        {formatCurrency(source.amount)}
      </td>

      {/* Month */}
      <td className="px-4 py-3 text-muted-foreground">
        {MONTH_LABELS[source.month - 1]}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onDelete(source)}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
        <span className="text-2xl">💰</span>
      </div>
      <p className="text-sm font-medium">No income sources for {month} {year}</p>
      <p className="mt-1 text-sm text-muted-foreground">
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border p-4">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {["Name", "Type", "Status", "Amount", "Month", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left">
                  <Skeleton className="h-3 w-12 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...Array(3)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                </td>
                <td className="px-4 py-3"><Skeleton className="h-3 w-16 rounded" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-3 w-16 rounded" /></td>
                <td className="px-4 py-3"><Skeleton className="h-3 w-16 rounded" /></td>
                <td className="px-4 py-3 text-right"><Skeleton className="ml-auto size-7 rounded-md" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
