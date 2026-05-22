"use client";

import {
  ChevronLeft,
  ChevronRight,
  CalendarDate,
  Plus,
} from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MONTH_LABELS } from "@/schema/income-sources";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethodTab = "all" | "card" | "upi" | "cash";

export type FilterState = {
  paymentMethodTab: PaymentMethodTab;
};

type TransactionsFiltersProps = {
  filters: FilterState;
  month: number;
  year: number;
  isPending: boolean;
  onFilterChange: (tab: PaymentMethodTab) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddClick: () => void;
};

const METHOD_TABS: { key: PaymentMethodTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "card", label: "Card" },
  { key: "upi", label: "UPI" },
  { key: "cash", label: "Cash" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionsFilters({
  filters,
  month,
  year,
  isPending,
  onFilterChange,
  onPrevMonth,
  onNextMonth,
  onAddClick,
}: TransactionsFiltersProps) {
  const activeTab = filters.paymentMethodTab;

  const tabStrip = (
    <div className="flex items-center gap-0.5 rounded-lg p-0.5 h-8 sm:h-9 bg-muted">
      {METHOD_TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onFilterChange(t.key)}
          className={cn(
            "flex items-center rounded-md px-2.5 h-full text-xs font-medium transition-all",
            activeTab === t.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const monthNav = (
    <div className="flex items-center h-8 sm:h-9 rounded-md border bg-card overflow-hidden">
      <button
        onClick={onPrevMonth}
        disabled={isPending}
        className="flex h-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>
      <div className="flex items-center gap-1.5 px-2.5 text-xs font-medium min-w-28 sm:min-w-32 justify-center">
        <CalendarDate size={13} className="text-muted-foreground shrink-0" />
        {isPending ? (
          <Spinner className="size-3.5" />
        ) : (
          <span className="tabular-nums">
            {MONTH_LABELS[month - 1]} {year}
          </span>
        )}
      </div>
      <button
        onClick={onNextMonth}
        disabled={isPending}
        className="flex h-full items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      {/* Mobile: month nav + add button on same line */}
      {/* sm+: all three in one line */}
      <div className="flex items-center justify-end gap-2">
        <div className="hidden sm:block">{tabStrip}</div>
        {monthNav}
        <Button size="sm" className="shrink-0 gap-1.5" onClick={onAddClick}>
          <Plus size={15} />
          <span className="hidden sm:inline">Add expense</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </div>
  );
}
