import type { Metadata } from "next";

import { getCategories } from "@/actions/categories";
import { getRecurringExpenses } from "@/actions/recurring";
import { RecurringContent } from "@/features/recurring/recurring-content";

export const metadata: Metadata = {
  title: "Recurring | SpendWise",
  description: "Manage your recurring expenses and subscriptions.",
};

export default async function RecurringPage() {
  const [{ expense: categories }, { data: expenses }] = await Promise.all([
    getCategories(),
    getRecurringExpenses(),
  ]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <RecurringContent initialExpenses={expenses} categories={categories} />
    </div>
  );
}
