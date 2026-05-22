"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Plus, Tag01 } from "@untitledui/icons";
import { CategoryIcon } from "@/lib/category-icons";

import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/features/categories/category-dialog";
import { formatCurrency } from "@/lib/format";
import { getCategoryColor, getCategoryBg } from "@/lib/category-color";
import { cn } from "@/lib/utils";
import type { Category, CategoryType } from "@/types/categories";
import type { CategoryStat } from "@/actions/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoriesContentProps = {
  expense: Category[];
  income: Category[];
  stats: CategoryStat[];
};

// ─── Root component ───────────────────────────────────────────────────────────

export function CategoriesContent({
  expense,
  income,
  stats,
}: CategoriesContentProps) {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const statsMap = new Map(stats.map((s) => [s.category_id, s]));

  function openCreate() {
    setSelectedCategory(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setSelectedCategory(category);
    setDialogOpen(true);
  }

  const TABS: { key: CategoryType; label: string; count: number }[] = [
    { key: "expense", label: "Expense", count: expense.length },
    { key: "income", label: "Income", count: income.length },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* ── Tab strip + action ─────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 rounded-lg p-0.5 h-8 sm:h-9 bg-muted">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 h-full text-xs font-medium transition-all",
                  activeTab === t.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-10 tabular-nums font-medium",
                    activeTab === t.key
                      ? "bg-primary/10 text-primary"
                      : "bg-background/60 text-muted-foreground",
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <Button size="sm" className="gap-1.5 shrink-0" onClick={openCreate}>
            <Plus size={15} />
            <span className="hidden sm:inline">New category</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        <CategoryGrid
          categories={activeTab === "expense" ? expense : income}
          statsMap={statsMap}
          onEdit={openEdit}
          onNewClick={openCreate}
        />
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={selectedCategory ? selectedCategory.type : activeTab}
        category={selectedCategory}
      />
    </>
  );
}

// ─── Category grid ────────────────────────────────────────────────────────────

function CategoryGrid({
  categories,
  statsMap,
  onEdit,
  onNewClick,
}: {
  categories: Category[];
  statsMap: Map<string, CategoryStat>;
  onEdit: (category: Category) => void;
  onNewClick: () => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center rounded-xl border border-dashed">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted">
          <Tag01 size={20} className="text-muted-foreground" />
        </div>
        <p className="text-xs sm:text-13 font-medium">No categories yet</p>
        <p className="mt-1 text-11 sm:text-xs text-muted-foreground max-w-xs">
          Create your first category to start organising transactions.
        </p>
      </div>
    );
  }

  const maxAmount = Math.max(
    ...categories.map((c) => statsMap.get(c.id)?.amount ?? 0),
    1,
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          stat={statsMap.get(category.id)}
          maxAmount={maxAmount}
          onEdit={onEdit}
        />
      ))}
      {/* New category card */}
      <button
        onClick={onNewClick}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-transparent p-4 text-muted-foreground transition-colors hover:text-foreground min-h-42"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <Plus size={18} />
        </div>
        <div className="text-center">
          <p
            className="text-xs sm:text-13 font-medium"
            style={{ color: "inherit" }}
          >
            New category
          </p>
          <p className="mt-0.5 text-11 text-muted-foreground">
            Custom group for transactions
          </p>
        </div>
      </button>
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  stat,
  maxAmount,
  onEdit,
}: {
  category: Category;
  stat: CategoryStat | undefined;
  maxAmount: number;
  onEdit: (category: Category) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const rawColor = category.color ?? "#6b7280";
  const color = getCategoryColor(rawColor, isDark);
  const iconBg = getCategoryBg(rawColor, isDark);

  const hasActivity = stat && stat.count > 0;
  const spent = stat?.amount ?? 0;
  const budget = category.monthly_budget;
  const hasBudget = budget !== null && budget !== undefined && budget > 0;

  const budgetPct = hasBudget ? Math.min((spent / budget!) * 100, 100) : 0;
  const relativePct = hasActivity ? Math.max(4, (spent / maxAmount) * 100) : 0;
  const barPct = hasBudget
    ? Math.max(hasActivity ? 2 : 0, budgetPct)
    : relativePct;

  const isOverBudget = hasBudget && spent > budget!;
  const isNearBudget = hasBudget && !isOverBudget && budgetPct >= 80;
  const barColor = isOverBudget
    ? getCategoryColor("#ef4444", isDark)
    : isNearBudget
      ? getCategoryColor("#f59e0b", isDark)
      : color;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(category)}
      onKeyDown={(e) => e.key === "Enter" && onEdit(category)}
      className="cursor-pointer relative flex w-full flex-col gap-2.5 overflow-hidden rounded-xl border bg-card text-left text-card-foreground transition-all duration-150 hover:border-border-strong min-h-42 p-3.5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Left accent stripe */}
      <span
        className="absolute left-0 top-0 bottom-0 w-0.75 rounded-l-xl"
        style={{ backgroundColor: color }}
      />

      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between">
        <div
          className="flex size-9 sm:size-10 items-center justify-center rounded-lg"
          style={{ background: iconBg, color }}
        >
          <CategoryIcon icon={category.icon} size={18} />
        </div>
        {isOverBudget && (
          <span className="rounded-full px-2 py-0.5 text-10 font-medium bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            Over budget
          </span>
        )}
        {!isOverBudget && category.is_default && (
          <span
            className="rounded-full px-2 py-0.5 text-10 font-medium"
            style={{
              background: `color-mix(in oklch, ${color} 15%, transparent)`,
              color,
            }}
          >
            Default
          </span>
        )}
        {!isOverBudget && !hasActivity && !category.is_default && (
          <span
            className="rounded-full px-2 py-0.5 text-10 font-medium"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            Unused
          </span>
        )}
      </div>

      {/* Name + activity */}
      <div className="flex-1">
        <p className="text-xs sm:text-13 font-semibold leading-tight truncate">
          {category.name}
        </p>
        <p className="mt-0.5 text-11 text-muted-foreground">
          {hasActivity
            ? `${stat.count} txn${stat.count !== 1 ? "s" : ""} this month`
            : "No activity this month"}
        </p>
      </div>

      {/* Amount row — spend/budget on the left, Set Budget nudge on the right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1">
          {hasBudget ? (
            <>
              <p
                className="text-13 font-semibold tabular-nums tracking-tight"
                style={{ color: barColor }}
              >
                {formatCurrency(spent)}
              </p>
              <p className="text-11 text-muted-foreground tabular-nums">
                of {formatCurrency(budget!)}
              </p>
            </>
          ) : hasActivity ? (
            <p
              className="text-13 font-semibold tabular-nums tracking-tight"
              style={{ color }}
            >
              {formatCurrency(spent)}
            </p>
          ) : null}
        </div>

        {category.type === "expense" && !hasBudget && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-10 font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            + Set budget
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-0.75 rounded-full overflow-hidden"
        style={{ background: "var(--muted)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${barPct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
