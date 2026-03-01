import type { Metadata } from "next";

import { getCategories } from "@/actions/categories";
import { getTransactions } from "@/actions/transactions";
import { TransactionsContent } from "@/features/transactions/transactions-content";
import { todayISO } from "@/lib/format";

export const metadata: Metadata = {
  title: "Expenses | SpendWise",
  description: "View and manage all your expenses.",
};

export default async function TransactionsPage() {
  // Compute IST today so the server-fetched data matches the client's initial month state
  const [y, m] = todayISO().split("-").map(Number);
  const mm = String(m).padStart(2, "0");
  const lastDay = new Date(y, m, 0).getDate();
  const dateFrom = `${y}-${mm}-01`;
  const dateTo = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const [{ expense }, txResult] = await Promise.all([
    getCategories(),
    getTransactions({ type: "expense", date_from: dateFrom, date_to: dateTo }, 1),
  ]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <TransactionsContent
        initialTransactions={txResult.data}
        initialTotal={txResult.total}
        categories={expense}
        initialMonth={m}
        initialYear={y}
      />
    </div>
  );
}
