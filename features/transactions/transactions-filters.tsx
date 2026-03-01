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
