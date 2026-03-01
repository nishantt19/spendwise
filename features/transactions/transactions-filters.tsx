"use client";

import { Plus, SearchMd, FilterLines } from "@untitledui/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/schema/transactions";
import { CategoryIcon } from "@/lib/category-icons";
import type { Category } from "@/types/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterState = {
  search: string;
  categoryId: string;
  paymentMethod: string;
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
    <div className="flex flex-col gap-2 sm:gap-3">
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
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <Button
          size="default"
          className="shrink-0 gap-1.5 text-xs sm:text-sm"
          onClick={onAddClick}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add expense</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* ── Filter row — horizontally scrollable on mobile ────────────── */}
      <div className="flex items-center gap-2">
        <FilterLines size={15} className="shrink-0 text-muted-foreground" />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Category */}
          <Select
            value={filters.categoryId || "_all"}
            onValueChange={(val) =>
              onFilterChange("categoryId", val === "_all" ? "" : val)
            }
          >
            <SelectTrigger className="h-8 w-36 sm:w-40 shrink-0 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All categories</SelectItem>
              {categories
                .filter((c) => c.type === "expense")
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-1.5">
                      <CategoryIcon icon={cat.icon} size={13} />
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
            <SelectTrigger className="h-8 w-32 sm:w-36 shrink-0 text-xs">
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

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearAll}
              className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {activeFilterCount}
              </Badge>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
