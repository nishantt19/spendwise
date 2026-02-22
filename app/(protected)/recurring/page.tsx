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

  const activeCount = expenses.filter((e) => e.is_active).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recurring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {expenses.length > 0
            ? `${activeCount} active · ${expenses.length - activeCount} paused`
            : "Set up subscriptions, EMIs, and other repeating expenses."}
        </p>
      </div>

      <RecurringContent initialExpenses={expenses} categories={categories} />
    </div>
  );
}
