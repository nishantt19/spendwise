import type { Metadata } from "next";

import { getCategories } from "@/actions/categories";
import { CategoriesContent } from "@/features/categories/categories-content";

export const metadata: Metadata = {
  title: "Categories | SpendWise",
  description: "Manage your expense and income categories.",
};

export default async function CategoriesPage() {
  const { expense, income } = await getCategories();

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          Organise your transactions with custom expense and income categories.
        </p>
      </div>

      <CategoriesContent expense={expense} income={income} />
    </div>
  );
}
