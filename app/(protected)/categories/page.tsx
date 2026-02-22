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
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organise your transactions with custom expense and income categories.
        </p>
      </div>

      <CategoriesContent expense={expense} income={income} />
    </div>
  );
}
