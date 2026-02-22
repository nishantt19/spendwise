import type { Metadata } from "next";

import { getCategories } from "@/actions/categories";
import { getTransactions } from "@/actions/transactions";
import { TransactionsContent } from "@/features/transactions/transactions-content";

export const metadata: Metadata = {
  title: "Expenses | SpendWise",
  description: "View and manage all your expenses.",
};

export default async function TransactionsPage() {
  // Fetch expense categories and first page of expense transactions in parallel
  const [{ expense }, txResult] = await Promise.all([
    getCategories(),
    getTransactions({ type: "expense" }, 1),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {txResult.total > 0
            ? `${txResult.total} expense${txResult.total !== 1 ? "s" : ""} total`
            : "No expenses yet — add your first one."}
        </p>
      </div>

      <TransactionsContent
        initialTransactions={txResult.data}
        initialTotal={txResult.total}
        categories={expense}
      />
    </div>
  );
}
