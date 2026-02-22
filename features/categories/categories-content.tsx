"use client";

import { useState } from "react";
import { Plus } from "@untitledui/icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryDialog } from "@/features/categories/category-dialog";
import type { Category, CategoryType } from "@/types/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoriesContentProps = {
  expense: Category[];
  income: Category[];
};

// ─── Root component ───────────────────────────────────────────────────────────

export function CategoriesContent({ expense, income }: CategoriesContentProps) {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  function openCreate() {
    setSelectedCategory(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setSelectedCategory(category);
    setDialogOpen(true);
  }

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as CategoryType)}
      >
        <div className="flex items-center justify-between">
          <TabsList className="h-9">
            <TabsTrigger value="expense" className="gap-1.5">
              Expense
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] font-normal"
              >
                {expense.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-1.5">
              Income
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] font-normal"
              >
                {income.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <Button size="sm" onClick={openCreate}>
            <span className="flex items-center justify-center gap-1.5">
              <Plus size={15} />
              New Category
            </span>
          </Button>
        </div>

        <TabsContent value="expense" className="mt-6">
          <CategoryGrid categories={expense} onEdit={openEdit} />
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <CategoryGrid categories={income} onEdit={openEdit} />
        </TabsContent>
      </Tabs>

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
  onEdit,
}: {
  categories: Category[];
  onEdit: (category: Category) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl">📂</span>
        </div>
        <p className="text-sm font-medium">No categories yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first category to start organising transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} onEdit={onEdit} />
      ))}
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  onEdit,
}: {
  category: Category;
  onEdit: (category: Category) => void;
}) {
  return (
    <button
      onClick={() => onEdit(category)}
      className="group relative flex w-full flex-col items-center gap-2.5 overflow-hidden rounded-xl border bg-card px-3 py-4 text-center text-card-foreground transition-all duration-150 hover:border-primary/30 hover:shadow-sm"
    >
      {/* Category icon */}
      <div
        className="flex size-12 items-center justify-center rounded-xl text-2xl"
        style={{
          backgroundColor: `${category.color}1a`,
          border: `1.5px solid ${category.color}33`,
        }}
      >
        {category.icon ?? "📁"}
      </div>

      {/* Name + default badge */}
      <div className="w-full space-y-1">
        <p className="truncate text-sm font-medium leading-tight">
          {category.name}
        </p>
        {category.is_default && (
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-normal"
          >
            Default
          </Badge>
        )}
      </div>

      {/* Colour accent bar — animates in on hover */}
      <span
        className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full opacity-50 transition-all duration-200 group-hover:w-3/4 group-hover:opacity-100"
        style={{ backgroundColor: category.color }}
      />
    </button>
  );
}
