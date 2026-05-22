"use server";

import { createClient } from "@/lib/supabase/server";
import { RECURRING_MONTHLY_MULTIPLIERS } from "@/schema/recurring";
import type { TransactionWithCategory } from "@/types/transactions";
import type { RecurringWithCategory } from "@/types/recurring";

// ─── Public types (consumed by chart components and page) ─────────────────────

export type TrendPoint = {
  month: string; // "Sep", "Oct" …
  expenses: number;
  income: number;
};

export type CategoryStat = {
  name: string;
  icon: string | null;
  color: string;
  amount: number;
};

export type DashboardData = {
  // Current-month stats
  monthlyExpenses: number;
  monthlyIncomeExpected: number;
  monthlyIncomeReceived: number;
  // Recurring snapshot
  recurringMonthlyTotal: number;
  activeRecurringCount: number;
  // Charts
  trend: TrendPoint[];
  categories: CategoryStat[]; // top 6 by amount, current month
  // Lists
  recentExpenses: TransactionWithCategory[];
  upcomingRecurring: RecurringWithCategory[]; // first 5 active, soonest first
};

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return emptyDashboard();
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const last6 = getLast6Months();
  const earliest = `${last6[0].year}-${pad(last6[0].month)}-01`;
  const monthStart = `${year}-${pad(month)}-01`;
  // Use day-0 of the next month = last real day of this month (handles Feb, 30-day months, etc.)
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;

  // Unique years needed for income trend query
  const trendYears = [...new Set(last6.map((m) => m.year))];

  // ── Fire all queries in parallel ──────────────────────────────────────────
  const [
    trendExpensesRes,
    trendIncomeRes,
    categoryRes,
    recentRes,
    recurringRes,
    monthlyIncomeRes,
  ] = await Promise.all([
    // Expenses in the last 6 months (date + amount only)
    supabase
      .from("transactions")
      .select("date, amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("is_deleted", false)
      .gte("date", earliest),

    // Income sources in the relevant calendar years
    supabase
      .from("income_sources")
      .select("month, year, amount, is_received")
      .eq("user_id", user.id)
      .in("year", trendYears),

    // This month's expenses with category (for breakdown)
    supabase
      .from("transactions")
      .select("amount, category:categories(id, name, icon, color)")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("is_deleted", false)
      .gte("date", monthStart)
      .lte("date", monthEnd),

    // Last 5 expenses (for recent list)
    supabase
      .from("transactions")
      .select("*, category:categories(id, name, icon, color, type)")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("is_deleted", false)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),

    // All recurring (for active toggle + upcoming list)
    supabase
      .from("recurring_expenses")
      .select("*, category:categories(id, name, icon, color, type)")
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("next_due_date", { ascending: true }),

    // This month's income sources (for summary stats)
    supabase
      .from("income_sources")
      .select("amount, is_received")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year),
  ]);

  // ── Build trend ────────────────────────────────────────────────────────────
  const trendExpenses = trendExpensesRes.data ?? [];
  const trendIncome = trendIncomeRes.data ?? [];

  const trend: TrendPoint[] = last6.map(({ label, month: m, year: y, datePrefix }) => ({
    month: label,
    expenses: trendExpenses
      .filter((t) => t.date.startsWith(datePrefix))
      .reduce((sum, t) => sum + t.amount, 0),
    income: trendIncome
      .filter((s) => s.month === m && s.year === y && s.is_received)
      .reduce((sum, s) => sum + s.amount, 0),
  }));

  // ── Build category breakdown ───────────────────────────────────────────────
  const catMap = new Map<string, CategoryStat>();

  for (const tx of categoryRes.data ?? []) {
    const cat = tx.category as unknown as { id: string; name: string; icon: string | null; color: string } | null;
    const key = cat?.id ?? "__none__";
    const existing = catMap.get(key);
    if (existing) {
      existing.amount += tx.amount;
    } else {
      catMap.set(key, {
        name: cat?.name ?? "Uncategorized",
        icon: cat?.icon ?? null,
        color: cat?.color ?? "#6b7280",
        amount: tx.amount,
      });
    }
  }

  const categories = [...catMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // ── Current-month income stats ─────────────────────────────────────────────
  const monthlyIncomeSources = monthlyIncomeRes.data ?? [];
  const monthlyIncomeExpected = monthlyIncomeSources.reduce(
    (sum, s) => sum + s.amount,
    0,
  );
  const monthlyIncomeReceived = monthlyIncomeSources
    .filter((s) => s.is_received)
    .reduce((sum, s) => sum + s.amount, 0);

  // ── Current-month expense total ────────────────────────────────────────────
  const monthlyExpenses = (categoryRes.data ?? []).reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  // ── Recurring stats ────────────────────────────────────────────────────────
  const allRecurring = (recurringRes.data ?? []) as RecurringWithCategory[];
  const activeRecurring = allRecurring.filter((r) => r.is_active);
  const recurringMonthlyTotal = activeRecurring.reduce(
    (sum, r) => sum + r.amount * RECURRING_MONTHLY_MULTIPLIERS[r.frequency],
    0,
  );

  return {
    monthlyExpenses,
    monthlyIncomeExpected,
    monthlyIncomeReceived,
    recurringMonthlyTotal,
    activeRecurringCount: activeRecurring.length,
    trend,
    categories,
    recentExpenses: (recentRes.data ?? []) as TransactionWithCategory[],
    upcomingRecurring: activeRecurring.slice(0, 5),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLast6Months(): Array<{
  label: string;
  year: number;
  month: number;
  datePrefix: string;
}> {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    result.push({
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      year: y,
      month: m,
      datePrefix: `${y}-${pad(m)}`,
    });
  }
  return result;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function emptyDashboard(): DashboardData {
  return {
    monthlyExpenses: 0,
    monthlyIncomeExpected: 0,
    monthlyIncomeReceived: 0,
    recurringMonthlyTotal: 0,
    activeRecurringCount: 0,
    trend: getLast6Months().map(({ label }) => ({
      month: label,
      expenses: 0,
      income: 0,
    })),
    categories: [],
    recentExpenses: [],
    upcomingRecurring: [],
  };
}

// ─── Focused fetch functions (used by granular Suspense sections) ─────────────

export type StatCardData = {
  monthlyExpenses: number;
  monthlyIncomeExpected: number;
  monthlyIncomeReceived: number;
  recurringMonthlyTotal: number;
  activeRecurringCount: number;
  overdueRecurringCount: number;
};

export async function getStatCardData(): Promise<StatCardData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { monthlyExpenses: 0, monthlyIncomeExpected: 0, monthlyIncomeReceived: 0, recurringMonthlyTotal: 0, activeRecurringCount: 0, overdueRecurringCount: 0 };

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;

  const [expensesRes, incomeRes, recurringRes] = await Promise.all([
    supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "expense").eq("is_deleted", false).gte("date", monthStart).lte("date", monthEnd),
    supabase.from("income_sources").select("amount, is_received").eq("user_id", user.id).eq("month", month).eq("year", year),
    supabase.from("recurring_expenses").select("amount, frequency, is_active, next_due_date").eq("user_id", user.id),
  ]);

  const monthlyExpenses = (expensesRes.data ?? []).reduce((sum, t) => sum + t.amount, 0);
  const incomeSources = incomeRes.data ?? [];
  const monthlyIncomeExpected = incomeSources.reduce((sum, s) => sum + s.amount, 0);
  const monthlyIncomeReceived = incomeSources.filter((s) => s.is_received).reduce((sum, s) => sum + s.amount, 0);
  const activeRecurring = (recurringRes.data ?? []).filter((r) => r.is_active);
  const recurringMonthlyTotal = activeRecurring.reduce((sum, r) => sum + r.amount * RECURRING_MONTHLY_MULTIPLIERS[r.frequency as keyof typeof RECURRING_MONTHLY_MULTIPLIERS], 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdueRecurringCount = activeRecurring.filter((r) => r.next_due_date && new Date(r.next_due_date + "T00:00:00") < today).length;

  return { monthlyExpenses, monthlyIncomeExpected, monthlyIncomeReceived, recurringMonthlyTotal, activeRecurringCount: activeRecurring.length, overdueRecurringCount };
}

export async function getTrendData(): Promise<TrendPoint[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return getLast6Months().map(({ label }) => ({ month: label, expenses: 0, income: 0 }));

  const last6 = getLast6Months();
  const earliest = `${last6[0].year}-${pad(last6[0].month)}-01`;
  const trendYears = [...new Set(last6.map((m) => m.year))];

  const [expensesRes, incomeRes] = await Promise.all([
    supabase.from("transactions").select("date, amount").eq("user_id", user.id).eq("type", "expense").eq("is_deleted", false).gte("date", earliest),
    supabase.from("income_sources").select("month, year, amount, is_received").eq("user_id", user.id).in("year", trendYears),
  ]);

  return last6.map(({ label, month: m, year: y, datePrefix }) => ({
    month: label,
    expenses: (expensesRes.data ?? []).filter((t) => t.date.startsWith(datePrefix)).reduce((sum, t) => sum + t.amount, 0),
    income: (incomeRes.data ?? []).filter((s) => s.month === m && s.year === y && s.is_received).reduce((sum, s) => sum + s.amount, 0),
  }));
}

export async function getCategoryBreakdownData(): Promise<{ categories: CategoryStat[]; total: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { categories: [], total: 0 };

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;

  const { data } = await supabase.from("transactions").select("amount, category:categories(id, name, icon, color)").eq("user_id", user.id).eq("type", "expense").eq("is_deleted", false).gte("date", monthStart).lte("date", monthEnd);

  const catMap = new Map<string, CategoryStat>();
  for (const tx of data ?? []) {
    const cat = tx.category as unknown as { id: string; name: string; icon: string | null; color: string } | null;
    const key = cat?.id ?? "__none__";
    const existing = catMap.get(key);
    if (existing) { existing.amount += tx.amount; }
    else { catMap.set(key, { name: cat?.name ?? "Uncategorized", icon: cat?.icon ?? null, color: cat?.color ?? "#6b7280", amount: tx.amount }); }
  }

  const categories = [...catMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 6);
  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  return { categories, total };
}

export async function getRecentAndUpcomingData(): Promise<{
  recentExpenses: TransactionWithCategory[];
  upcomingRecurring: RecurringWithCategory[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { recentExpenses: [], upcomingRecurring: [] };

  const [recentRes, recurringRes] = await Promise.all([
    supabase.from("transactions").select("*, category:categories(id, name, icon, color, type)").eq("user_id", user.id).eq("type", "expense").eq("is_deleted", false).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(5),
    supabase.from("recurring_expenses").select("*, category:categories(id, name, icon, color, type)").eq("user_id", user.id).eq("is_active", true).order("next_due_date", { ascending: true }).limit(5),
  ]);

  return {
    recentExpenses: (recentRes.data ?? []) as TransactionWithCategory[],
    upcomingRecurring: (recurringRes.data ?? []) as RecurringWithCategory[],
  };
}
