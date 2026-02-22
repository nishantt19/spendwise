import type { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard02,
  Wallet01,
  TrendUp01,
  TrendDown01,
  RefreshCw04,
  ArrowRight,
} from "@untitledui/icons";

import { getDashboardData } from "@/actions/dashboard";
import { TrendChart } from "@/features/dashboard/trend-chart";
import { CategoryChart } from "@/features/dashboard/category-chart";
import { formatCurrency, formatDateShort, formatNextDueDate } from "@/lib/format";
import { RECURRING_FREQUENCY_LABELS } from "@/schema/recurring";
import { MONTH_LABELS } from "@/schema/income-sources";
import type { TransactionWithCategory } from "@/types/transactions";
import type { RecurringWithCategory } from "@/types/recurring";

export const metadata: Metadata = {
  title: "Dashboard | SpendWise",
  description: "Your personal finance overview.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getDashboardData();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const savings = data.monthlyIncomeReceived - data.monthlyExpenses;
  const savingsPositive = savings >= 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {MONTH_LABELS[month - 1]} {year} · Overview
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Expenses"
          value={formatCurrency(data.monthlyExpenses)}
          sub="This month"
          icon={CreditCard02}
          iconColor="#ef4444"
          iconBg="#ef44441a"
        />
        <StatCard
          label="Income"
          value={formatCurrency(data.monthlyIncomeReceived)}
          sub={
            data.monthlyIncomeExpected > 0
              ? `of ${formatCurrency(data.monthlyIncomeExpected)} expected`
              : "Received this month"
          }
          icon={Wallet01}
          iconColor="#10b981"
          iconBg="#10b9811a"
        />
        <StatCard
          label="Net savings"
          value={formatCurrency(Math.abs(savings))}
          sub={savingsPositive ? "Surplus this month" : "Deficit this month"}
          icon={savingsPositive ? TrendUp01 : TrendDown01}
          iconColor={savingsPositive ? "#10b981" : "#ef4444"}
          iconBg={savingsPositive ? "#10b9811a" : "#ef44441a"}
        />
        <StatCard
          label="Recurring"
          value={formatCurrency(data.recurringMonthlyTotal)}
          sub={`${data.activeRecurringCount} active · est. /month`}
          icon={RefreshCw04}
          iconColor="#6366f1"
          iconBg="#6366f11a"
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Trend — 2/3 */}
        <div className="flex flex-col rounded-xl border bg-card p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Spending overview</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Expenses vs income received
          </p>

          <TrendChart data={data.trend} />

          <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Income received
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" />
              Expenses
            </span>
          </div>
        </div>

        {/* Category breakdown — 1/3 */}
        <div className="flex flex-col rounded-xl border bg-card p-5">
          <h2 className="mb-0.5 text-sm font-semibold">
            By category
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            {MONTH_LABELS[month - 1]} · {formatCurrency(data.monthlyExpenses)} total
          </p>

          {data.categories.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <p className="text-center text-xs text-muted-foreground">
                No expenses in {MONTH_LABELS[month - 1]} yet.
              </p>
            </div>
          ) : (
            <CategoryChart data={data.categories} total={data.monthlyExpenses} />
          )}
        </div>
      </div>

      {/* ── Lists row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent expenses */}
        <div className="flex flex-col rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent expenses</h2>
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {data.recentExpenses.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-xs text-muted-foreground">No expenses yet.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {data.recentExpenses.map((tx) => (
                <RecentExpenseRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming recurring */}
        <div className="flex flex-col rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upcoming recurring</h2>
            <Link
              href="/recurring"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {data.upcomingRecurring.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-xs text-muted-foreground">
                No active recurring expenses.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {data.upcomingRecurring.map((r) => (
                <UpcomingRecurringRow key={r.id} expense={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

type IconComponent = React.FC<
  React.SVGProps<SVGSVGElement> & { size?: number; color?: string }
>;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  sub: string;
  icon: IconComponent;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div
        className="flex size-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={17} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

// ─── Recent expense row ───────────────────────────────────────────────────────

function RecentExpenseRow({ tx }: { tx: TransactionWithCategory }) {
  const cat = tx.category;

  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      {/* Category icon */}
      {cat?.color ? (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm"
          style={{
            backgroundColor: `${cat.color}1a`,
            border: `1px solid ${cat.color}30`,
          }}
        >
          {cat.icon ?? (
            <CreditCard02 size={14} style={{ color: cat.color }} />
          )}
        </div>
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
          <CreditCard02 size={14} className="text-muted-foreground" />
        </div>
      )}

      {/* Description + category */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.description}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {cat?.name ?? "Uncategorized"} · {formatDateShort(tx.date)}
        </p>
      </div>

      {/* Amount */}
      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        -{formatCurrency(tx.amount)}
      </p>
    </div>
  );
}

// ─── Upcoming recurring row ───────────────────────────────────────────────────

function UpcomingRecurringRow({ expense }: { expense: RecurringWithCategory }) {
  const { label: dueLabel, status: dueStatus } = formatNextDueDate(
    expense.next_due_date,
  );
  const cat = expense.category;

  const dueClass = {
    overdue: "text-red-500",
    today: "text-amber-500",
    soon: "text-amber-500",
    upcoming: "text-muted-foreground",
  }[dueStatus];

  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      {/* Icon */}
      {cat?.color ? (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm"
          style={{
            backgroundColor: `${cat.color}1a`,
            border: `1px solid ${cat.color}30`,
          }}
        >
          {cat.icon ?? (
            <RefreshCw04 size={14} style={{ color: cat.color }} />
          )}
        </div>
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          {cat?.icon ? (
            <span className="text-sm">{cat.icon}</span>
          ) : (
            <RefreshCw04 size={14} className="text-muted-foreground" />
          )}
        </div>
      )}

      {/* Name + frequency + due date */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{expense.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {RECURRING_FREQUENCY_LABELS[expense.frequency]}
          {" · "}
          <span className={dueClass}>{dueLabel}</span>
        </p>
      </div>

      {/* Amount */}
      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {formatCurrency(expense.amount)}
      </p>
    </div>
  );
}
