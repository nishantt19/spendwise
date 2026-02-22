"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, SearchMd, FilterLines, CalendarDate, X } from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/schema/transactions";
import type { Category } from "@/types/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterState = {
  search: string;
  categoryId: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
};

type TransactionsFiltersProps = {
  filters: FilterState;
  categories: Category[];
  activeFilterCount: number;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearAll: () => void;
  onAddClick: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionsFilters({
  filters,
  categories,
  activeFilterCount,
  onFilterChange,
  onClearAll,
  onAddClick,
}: TransactionsFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* ── Top row: search + add button ──────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchMd
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-9"
          />
        </div>

        <Button size="default" onClick={onAddClick}>
          <span className="flex items-center justify-center gap-1.5">
            <Plus size={15} />
            Add expense
          </span>
        </Button>
      </div>

      {/* ── Filter row ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterLines size={15} className="shrink-0 text-muted-foreground" />

        {/* Category */}
        <Select
          value={filters.categoryId || "_all"}
          onValueChange={(val) =>
            onFilterChange("categoryId", val === "_all" ? "" : val)
          }
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All categories</SelectItem>
            {categories.filter((c) => c.type === "expense").map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-1.5">
                  <span>{cat.icon ?? "📁"}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment method */}
        <Select
          value={filters.paymentMethod || "_all"}
          onValueChange={(val) =>
            onFilterChange("paymentMethod", val === "_all" ? "" : val)
          }
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All methods</SelectItem>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <DatePickerButton
          value={filters.dateFrom}
          placeholder="From"
          toDate={filters.dateTo ? parseISO(filters.dateTo) : undefined}
          onChange={(val) => onFilterChange("dateFrom", val)}
        />
        <DatePickerButton
          value={filters.dateTo}
          placeholder="To"
          fromDate={filters.dateFrom ? parseISO(filters.dateFrom) : undefined}
          onChange={(val) => onFilterChange("dateTo", val)}
        />

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DatePickerButton ─────────────────────────────────────────────────────────

type DatePickerButtonProps = {
  value: string; // "YYYY-MM-DD" or ""
  placeholder: string;
  fromDate?: Date;
  toDate?: Date;
  onChange: (value: string) => void;
};

function DatePickerButton({
  value,
  placeholder,
  fromDate,
  toDate,
  onChange,
}: DatePickerButtonProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? parseISO(value) : undefined;

  function handleSelect(date: Date | undefined) {
    onChange(date ? format(date, "yyyy-MM-dd") : "");
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex h-8 w-36 items-center gap-2 rounded-md border bg-transparent px-3 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
        >
          <CalendarDate size={14} className="shrink-0 text-muted-foreground" />
          <span className={`flex-1 text-left ${value ? "text-foreground" : "text-muted-foreground"}`}>
            {value ? format(parseISO(value), "dd MMM yyyy") : placeholder}
          </span>
          {value ? (
            <span
              role="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </span>
          ) : (
            <span className="opacity-0">
              <X size={12} />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={(date) => {
            if (fromDate && date < fromDate) return true;
            if (toDate && date > toDate) return true;
            return false;
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
