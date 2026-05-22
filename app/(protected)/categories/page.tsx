import type { Metadata } from "next";
import { TypographyH2 } from "@/components/ui/typography";

import { getCategories, getCategoryStats } from "@/actions/categories";
import { CategoriesContent } from "@/features/categories/categories-content";

export const metadata: Metadata = {
  title: "Categories | SpendWise",
  description: "Manage your expense and income categories.",
};

export default async function CategoriesPage() {
  const now = new Date();
  const [{ expense, income }, { data: stats }] = await Promise.all([
    getCategories(),
    getCategoryStats(now.getMonth() + 1, now.getFullYear()),
  ]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6">
      <div>
        <TypographyH2>Categories</TypographyH2>
        <p className="mt-0.5 text-xs sm:text-13 text-muted-foreground">
          Organise your transactions with custom expense and income categories.
        </p>
      </div>

      <CategoriesContent expense={expense} income={income} stats={stats} />
    </div>
  );
}
