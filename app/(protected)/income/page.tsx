import type { Metadata } from "next";

import { getIncomeSources } from "@/actions/income-sources";
import { IncomeContent } from "@/features/income/income-content";
import { MONTH_LABELS } from "@/schema/income-sources";

export const metadata: Metadata = {
  title: "Income | SpendWise",
  description: "Track your expected and received income each month.",
};

export default async function IncomePage() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-based
  const year = now.getFullYear();

  const { data: sources } = await getIncomeSources(month, year);

  const receivedCount = sources.filter((s) => s.is_received).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sources.length > 0
            ? `${receivedCount} of ${sources.length} source${sources.length !== 1 ? "s" : ""} received in ${MONTH_LABELS[month - 1]}`
            : "Track what you expect to receive each month."}
        </p>
      </div>

      <IncomeContent
        initialSources={sources}
        initialMonth={month}
        initialYear={year}
      />
    </div>
  );
}
