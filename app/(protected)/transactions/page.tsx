import type { Metadata } from "next";

import { getCategories } from "@/actions/categories";
import { getTransactions } from "@/actions/transactions";
import { TransactionsContent } from "@/features/transactions/transactions-content";

export const metadata: Metadata = {
  title: "Transactions | SpendWise",
  description: "View and manage all your income and expense transactions.",
};

export default async function TransactionsPage() {
  // Fetch categories and first page of transactions in parallel
  const [{ expense, income }, txResult] = await Promise.all([
    getCategories(),
    getTransactions({}, 1),
  ]);

  const allCategories = [...expense, ...income];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {txResult.total > 0
            ? `${txResult.total} transaction${txResult.total !== 1 ? "s" : ""} total`
            : "No transactions yet — add your first one."}
        </p>
      </div>

      <TransactionsContent
        initialTransactions={txResult.data}
        initialTotal={txResult.total}
        categories={allCategories}
      />
    </div>
  );
}
