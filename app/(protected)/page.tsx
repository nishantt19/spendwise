import { Suspense } from "react";
import type { Metadata } from "next";
import { TypographyH2 } from "@/components/ui/typography";

import {
  StatCards,
  StatCardsSkeleton,
  ChartsSection,
  ChartsSectionSkeleton,
  RecentExpensesSection,
  RecentExpensesSkeleton,
  UpcomingRecurringSection,
  UpcomingRecurringSkeleton,
} from "@/features/dashboard/dashboard-sections";
import { MONTH_LABELS } from "@/schema/income-sources";

export const metadata: Metadata = {
  title: "Dashboard | SpendWise",
  description: "Your personal finance overview.",
};

export default function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="flex flex-col gap-3.5 p-4 sm:p-6">
      <div>
        <TypographyH2>Dashboard</TypographyH2>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-13 text-muted-foreground flex-wrap">
          {MONTH_LABELS[month - 1]} {year} · Overview ·
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-10 font-semibold tabular-nums"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            Day {day} / {daysInMonth}
          </span>
        </p>
      </div>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <Suspense fallback={<ChartsSectionSkeleton />}>
        <ChartsSection />
      </Suspense>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Suspense fallback={<RecentExpensesSkeleton />}>
          <RecentExpensesSection />
        </Suspense>
        <Suspense fallback={<UpcomingRecurringSkeleton />}>
          <UpcomingRecurringSection />
        </Suspense>
      </div>
    </div>
  );
}
