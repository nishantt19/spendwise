import type { Metadata } from "next";

import { getIncomeSources } from "@/actions/income-sources";
import { getCategories } from "@/actions/categories";
import { IncomeContent } from "@/features/income/income-content";

export const metadata: Metadata = {
  title: "Income | SpendWise",
  description: "Track your expected and received income each month.",
};

export default async function IncomePage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [{ data: sources }, { income: incomeCategories }] = await Promise.all([
    getIncomeSources(month, year),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <IncomeContent
        initialSources={sources}
        initialMonth={month}
        initialYear={year}
        incomeCategories={incomeCategories}
      />
    </div>
  );
}
