import Link from "next/link";
import { TypographyH5 } from "@/components/ui/typography";
import {
  CreditCard02,
  Wallet01,
  TrendUp01,
  TrendDown01,
  RefreshCw04,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "@untitledui/icons";

import {
  getStatCardData,
  getTrendData,
  getCategoryBreakdownData,
  getRecentAndUpcomingData,
} from "@/actions/dashboard";
import { TrendChart } from "./trend-chart";
import { CategoryChart } from "./category-chart";
import {
  formatCurrency,
  formatNextDueDate,
  formatDayLabel,
} from "@/lib/format";
import { RECURRING_FREQUENCY_LABELS } from "@/schema/recurring";
import { MONTH_LABELS } from "@/schema/income-sources";
import { PAYMENT_METHOD_LABELS } from "@/schema/transactions";
import type { TransactionWithCategory } from "@/types/transactions";
import type { RecurringWithCategory } from "@/types/recurring";

// ─── Sparkline (pure SVG) ─────────────────────────────────────────────────────

function Sparkline({
  data,
  stroke = "var(--primary)",
  fill = "var(--primary-soft)",
  width = 60,
  height = 24,
}: {
  data: number[];
  stroke?: string;
  fill?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [
    i * stepX,
    height - ((v - min) / span) * (height - 4) - 2,
  ]);
  const line = pts
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width, height, display: "block" }}
    >
      <path d={area} fill={fill} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={stroke} />
    </svg>
  );
}

// ─── Merchant color helper ────────────────────────────────────────────────────

function merchantColor(name: string): string {
  const palettes = [
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--info)",
    "var(--warning)",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
  return palettes[h % palettes.length];
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

type IconComponent = React.FC<
  React.SVGProps<SVGSVGElement> & { size?: number; color?: string }
>;

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
  delta,
  deltaDir,
  spark,
  sparkStroke,
  sparkFill,
}: {
  label: string;
  value: string;
  sub: string;
  icon: IconComponent;
  iconColor: string;
  iconBg: string;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  spark?: number[];
  sparkStroke?: string;
  sparkFill?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-3.5 sm:p-4 shadow-card min-h-32.5">
      {/* Head: label left, icon right */}
      <div className="flex items-center justify-between">
        <span className="text-11 sm:text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <div
          className="flex size-6.5 items-center justify-center rounded-[7px]"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={13} style={{ color: iconColor }} />
        </div>
      </div>

      {/* Value — split ₹ symbol so it renders smaller than the number */}
      {value.startsWith("₹") ? (
        <p className="flex items-baseline gap-1 tabular-nums tracking-[-0.03em] leading-none">
          <span className="text-13 font-semibold text-muted-foreground tracking-normal">₹</span>
          <span className="text-[26px] font-semibold truncate">{value.slice(1)}</span>
        </p>
      ) : (
        <p className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] leading-none truncate">
          {value}
        </p>
      )}

      {/* Inline sparkline */}
      {spark && spark.length >= 2 && (
        <div className="h-7">
          <Sparkline
            data={spark}
            stroke={sparkStroke ?? "var(--primary)"}
            fill={sparkFill ?? "var(--primary-soft)"}
            width={120}
            height={28}
          />
        </div>
      )}

      {/* Footer: sub-text left, delta right */}
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-11 text-muted-foreground leading-tight truncate">
          {sub}
        </span>
        {delta && (
          <span
            className="shrink-0 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-11 font-medium"
            style={{
              background:
                deltaDir === "up"
                  ? "var(--primary-soft)"
                  : deltaDir === "down"
                    ? "var(--destructive-soft)"
                    : "var(--muted)",
              color:
                deltaDir === "up"
                  ? "var(--primary)"
                  : deltaDir === "down"
                    ? "var(--destructive)"
                    : "var(--muted-foreground)",
            }}
          >
            {deltaDir === "up" && <ArrowUp size={9} strokeWidth={2.5} />}
            {deltaDir === "down" && <ArrowDown size={9} strokeWidth={2.5} />}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export async function StatCards() {
  const [data, trend] = await Promise.all([getStatCardData(), getTrendData()]);
  const savings = data.monthlyIncomeReceived - data.monthlyExpenses;
  const savingsPositive = savings >= 0;

  const expenseSpark = trend.map((p) => p.expenses);
  const incomeSpark = trend.map((p) => p.income);

  const prevExpenses = trend[trend.length - 2]?.expenses ?? 0;
  const currExpenses = trend[trend.length - 1]?.expenses ?? 0;
  const expenseDelta =
    prevExpenses > 0 ? ((currExpenses - prevExpenses) / prevExpenses) * 100 : 0;
  const expenseDeltaStr =
    expenseDelta !== 0 ? `${Math.abs(expenseDelta).toFixed(0)}%` : undefined;
  const expenseDeltaDir =
    expenseDelta > 5
      ? ("down" as const)
      : expenseDelta < -5
        ? ("up" as const)
        : ("flat" as const);

  const prevIncome = trend[trend.length - 2]?.income ?? 0;
  const currIncome = trend[trend.length - 1]?.income ?? 0;
  const incomeDelta =
    prevIncome > 0 ? ((currIncome - prevIncome) / prevIncome) * 100 : 0;
  const incomeDeltaStr =
    incomeDelta !== 0 ? `${Math.abs(incomeDelta).toFixed(0)}%` : undefined;
  const incomeDeltaDir =
    incomeDelta > 5
      ? ("up" as const)
      : incomeDelta < -5
        ? ("down" as const)
        : ("flat" as const);

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      <KpiCard
        label="Expenses"
        value={formatCurrency(data.monthlyExpenses)}
        sub="This month"
        icon={CreditCard02}
        iconColor="var(--destructive)"
        iconBg="var(--destructive-soft)"
        delta={expenseDeltaStr}
        deltaDir={expenseDeltaDir}
        spark={expenseSpark}
        sparkStroke="var(--destructive)"
        sparkFill="var(--destructive-soft)"
      />
      <KpiCard
        label="Income"
        value={formatCurrency(data.monthlyIncomeReceived)}
        sub={
          data.monthlyIncomeExpected > 0
            ? `of ${formatCurrency(data.monthlyIncomeExpected)} expected`
            : "Received this month"
        }
        icon={Wallet01}
        iconColor="var(--primary)"
        iconBg="var(--primary-soft)"
        delta={incomeDeltaStr}
        deltaDir={incomeDeltaDir}
        spark={incomeSpark}
        sparkStroke="var(--primary)"
        sparkFill="var(--primary-soft)"
      />
      <KpiCard
        label="Net savings"
        value={formatCurrency(Math.abs(savings))}
        sub={savingsPositive ? "Surplus this month" : "Deficit this month"}
        icon={savingsPositive ? TrendUp01 : TrendDown01}
        iconColor={savingsPositive ? "var(--primary)" : "var(--destructive)"}
        iconBg={
          savingsPositive ? "var(--primary-soft)" : "var(--destructive-soft)"
        }
      />
      <KpiCard
        label="Recurring"
        value={formatCurrency(data.recurringMonthlyTotal)}
        sub={data.overdueRecurringCount > 0 ? `${data.activeRecurringCount} active · ${data.overdueRecurringCount} overdue` : `${data.activeRecurringCount} active`}
        icon={RefreshCw04}
        iconColor="var(--warning)"
        iconBg="var(--warning-soft)"
      />
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 sm:gap-2.5 rounded-xl border bg-card p-3 sm:p-4 animate-pulse"
        >
          <div className="size-7 sm:size-8 rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-14 rounded bg-muted" />
            <div className="h-5 sm:h-7 w-24 rounded bg-muted" />
            <div className="h-2 w-20 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Trend + Category Charts ──────────────────────────────────────────────────

export async function ChartsSection() {
  const now = new Date();
  const month = now.getMonth() + 1;

  const [trend, { categories, total }] = await Promise.all([
    getTrendData(),
    getCategoryBreakdownData(),
  ]);

  const validMonths = trend.filter((p) => p.expenses > 0);
  const avgExpense =
    validMonths.length > 0
      ? validMonths.reduce((s, p) => s + p.expenses, 0) / validMonths.length
      : 0;
  const peakMonth = trend.reduce(
    (best, p) => (p.expenses > best.expenses ? p : best),
    trend[0] ?? { month: "—", expenses: 0 },
  );

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      <div className="flex flex-col rounded-xl border bg-card shadow-card lg:col-span-2 overflow-hidden">
        <div className="flex items-start justify-between px-4 sm:px-5 pt-4 sm:pt-5">
          <div>
            <TypographyH5>Spending overview</TypographyH5>
            <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
              Expenses vs income · last 6 months
            </p>
          </div>
        </div>

        {avgExpense > 0 && (
          <div className="mx-4 sm:mx-5 mt-3 grid grid-cols-3 border-t border-border">
            <div className="py-2.5 pr-3">
              <p className="text-11 text-muted-foreground">Avg expense</p>
              <p className="mt-1 text-13 sm:text-base font-semibold tabular-nums tracking-tight">
                {formatCurrency(avgExpense)}
                <span className="text-11 font-normal text-muted-foreground">
                  {" "}
                  /mo
                </span>
              </p>
            </div>
            <div className="py-2.5 px-3 border-l border-border">
              <p className="text-11 text-muted-foreground">
                Peak ({peakMonth.month})
              </p>
              <p className="mt-1 text-13 sm:text-base font-semibold tabular-nums tracking-tight">
                {formatCurrency(peakMonth.expenses)}
              </p>
            </div>
            <div className="py-2.5 pl-3 border-l border-border">
              <p className="text-11 text-muted-foreground">This month</p>
              <p className="mt-1 text-13 sm:text-base font-semibold tabular-nums tracking-tight">
                {formatCurrency(trend[trend.length - 1]?.expenses ?? 0)}
              </p>
            </div>
          </div>
        )}

        <div className="px-4 sm:px-5 pt-3 pb-2">
          <TrendChart data={trend} />
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex items-center gap-4 sm:gap-5 text-11 sm:text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm"
              style={{ background: "var(--chart-2)" }}
            />
            Income received
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm"
              style={{ background: "var(--destructive)" }}
            />
            Expenses
          </span>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5">
          <TypographyH5>By category</TypographyH5>
          <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
            {MONTH_LABELS[month - 1]} recap · {formatCurrency(total)}
          </p>
        </div>
        {categories.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
            <p className="text-center text-11 sm:text-xs text-muted-foreground">
              No expenses in {MONTH_LABELS[month - 1]} yet.
            </p>
          </div>
        ) : (
          <CategoryChart
            data={categories}
            total={total}
            month={MONTH_LABELS[month - 1]}
          />
        )}
      </div>
    </div>
  );
}

export function ChartsSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2 animate-pulse">
        <div className="mb-4 space-y-1">
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-2.5 w-44 rounded bg-muted" />
        </div>
        <div className="h-55 rounded-lg bg-muted" />
      </div>
      <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 animate-pulse">
        <div className="mb-4 space-y-1">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-2.5 w-32 rounded bg-muted" />
        </div>
        <div className="h-45 rounded-full bg-muted mx-auto w-45" />
      </div>
    </div>
  );
}

// ─── Recent Expenses ──────────────────────────────────────────────────────────

// Desktop row (sm+)
function RecentExpenseRow({ tx }: { tx: TransactionWithCategory }) {
  const name = tx.description;
  const cat = tx.category;
  const color = merchantColor(name);

  return (
    <div className="flex items-center gap-3 py-2 border-t border-subtle-foreground/10">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-11 font-semibold"
        style={{
          background: `color-mix(in oklch, ${color} 18%, var(--muted))`,
          color,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-13 font-medium">{name}</p>
        <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
          {cat?.name ?? "Uncategorized"}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-10 font-medium"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
      >
        Cleared
      </span>
      <p className="shrink-0 text-xs sm:text-13 font-semibold tabular-nums">
        −{formatCurrency(tx.amount)}
      </p>
    </div>
  );
}

// Mobile card row
function MobileRecentExpenseCard({ tx }: { tx: TransactionWithCategory }) {
  const name = tx.description;
  const cat = tx.category;
  const color = merchantColor(name);

  return (
    <div className="flex items-center gap-3 px-3.5 py-3 bg-card border border-border rounded-xl">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold"
        style={{
          background: `color-mix(in oklch, ${color} 18%, var(--muted))`,
          color,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <span
            className="inline-flex items-center rounded-full px-1.5 py-px text-[10.5px] font-medium"
            style={{
              background: `color-mix(in oklch, ${color} 18%, var(--muted))`,
              color,
            }}
          >
            {cat?.name ?? "Uncategorized"}
          </span>
          <span>·</span>
          <span>{PAYMENT_METHOD_LABELS[tx.payment_method]}</span>
        </div>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">
        −{formatCurrency(tx.amount)}
      </p>
    </div>
  );
}

export async function RecentExpensesSection() {
  const { recentExpenses } = await getRecentAndUpcomingData();

  const groups: { date: string; items: TransactionWithCategory[] }[] = [];
  const dateMap = new Map<string, TransactionWithCategory[]>();
  for (const tx of recentExpenses) {
    if (!dateMap.has(tx.date)) {
      const arr: TransactionWithCategory[] = [];
      dateMap.set(tx.date, arr);
      groups.push({ date: tx.date, items: arr });
    }
    dateMap.get(tx.date)!.push(tx);
  }

  return (
    <>
      {/* ── Mobile layout ─────────────────────────────────────── */}
      <div className="sm:hidden flex flex-col">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-sm font-semibold tracking-tight">
            Recent activity
          </span>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {recentExpenses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No expenses yet.
          </p>
        ) : (
          <div>
            {groups.map((g, idx) => {
              const dayTotal = g.items.reduce((s, t) => s + t.amount, 0);
              return (
                <div key={g.date}>
                  <div
                    className={`flex items-center justify-between pb-1.5 px-1 text-10 sm:text-11 font-medium uppercase tracking-[0.08em] ${idx > 0 ? "pt-3.5" : "pt-1"}`}
                    style={{ color: "var(--subtle-foreground)" }}
                  >
                    <span>{formatDayLabel(g.date)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      −{formatCurrency(dayTotal)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {g.items.map((tx) => (
                      <MobileRecentExpenseCard key={tx.id} tx={tx} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Desktop layout (sm+) ──────────────────────────────── */}
      <div className="hidden sm:flex flex-col rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
          <div>
            <TypographyH5>Recent expenses</TypographyH5>
            {recentExpenses.length > 0 && (
              <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
                {recentExpenses.length} transaction{recentExpenses.length !== 1 ? "s" : ""} · {formatCurrency(recentExpenses.reduce((s, t) => s + t.amount, 0))} total
              </p>
            )}
          </div>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-11 sm:text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 px-4">
            <p className="text-xs text-muted-foreground">No expenses yet.</p>
          </div>
        ) : (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            {groups.map((g) => {
              const dayTotal = g.items.reduce((s, t) => s + t.amount, 0);
              return (
                <div key={g.date}>
                  <div
                    className="flex items-center justify-between py-1.5 text-10 sm:text-11 font-medium uppercase tracking-wider"
                    style={{ color: "var(--subtle-foreground)" }}
                  >
                    <span>{formatDayLabel(g.date)}</span>
                    <span className="tabular-nums">
                      {formatCurrency(dayTotal)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {g.items.map((tx) => (
                      <RecentExpenseRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export function RecentExpensesSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-2.5 w-14 rounded bg-muted" />
      </div>
      <div className="flex flex-col divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="size-8 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-2.5 w-24 rounded bg-muted" />
            </div>
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Upcoming Recurring ───────────────────────────────────────────────────────

function UpcomingTimeline({ items }: { items: RecurringWithCategory[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const HALF = 30;
  const SPAN = 60;

  return (
    <div className="px-4 sm:px-5 pb-3">
      <div className="flex items-center justify-between text-10 sm:text-11 text-muted-foreground mb-1.5 uppercase tracking-wider">
        <span>60-day timeline</span>
        <span>Today + 30d →</span>
      </div>
      <div
        className="relative h-8 rounded-lg overflow-hidden"
        style={{
          background: "color-mix(in oklch, var(--muted) 60%, transparent)",
        }}
      >
        {[0.25, 0.5, 0.75].map((p) => (
          <span
            key={p}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${p * 100}%`, background: "var(--border)" }}
          />
        ))}
        <span
          className="absolute top-0 bottom-0 w-0.5"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--foreground)",
          }}
        />
        {items.map((item) => {
          const due = new Date(item.next_due_date + "T00:00:00");
          const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
          if (diff < -HALF || diff > HALF) return null;
          const pct = ((diff + HALF) / SPAN) * 100;
          const overdue = diff < 0;
          return (
            <div
              key={item.id}
              className="absolute top-1.5 bottom-1.5 w-1.5 rounded-full"
              style={{
                left: `${pct}%`,
                transform: "translateX(-50%)",
                background: overdue ? "var(--destructive)" : "var(--primary)",
              }}
              title={`${item.name} · ${formatCurrency(item.amount)} · ${overdue ? `${Math.abs(diff)}d overdue` : `due in ${diff}d`}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-10 text-muted-foreground/60 tabular-nums">
        <span>−30d</span>
        <span>−15d</span>
        <span className="font-medium text-foreground/60">today</span>
        <span>+15d</span>
        <span>+30d</span>
      </div>
    </div>
  );
}

// Mobile card row for upcoming recurring
function MobileUpcomingRecurringCard({
  expense,
}: {
  expense: RecurringWithCategory;
}) {
  const { label: dueLabel, status: dueStatus } = formatNextDueDate(
    expense.next_due_date,
  );
  const name = expense.name;
  const color = merchantColor(name);
  const dueColor =
    dueStatus === "overdue"
      ? "var(--destructive)"
      : dueStatus === "today" || dueStatus === "soon"
        ? "var(--warning)"
        : "var(--muted-foreground)";

  return (
    <div className="flex items-center gap-3 px-3.5 py-3 bg-card border border-border rounded-xl">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold"
        style={{
          background: `color-mix(in oklch, ${color} 18%, var(--muted))`,
          color,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          {RECURRING_FREQUENCY_LABELS[expense.frequency]}
          {" · "}
          <span style={{ color: dueColor }}>{dueLabel}</span>
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">
        {formatCurrency(expense.amount)}
      </p>
    </div>
  );
}

function UpcomingRecurringRow({ expense }: { expense: RecurringWithCategory }) {
  const { label: dueLabel, status: dueStatus } = formatNextDueDate(
    expense.next_due_date,
  );
  const name = expense.name;
  const color = merchantColor(name);

  const dueBadgeStyle = {
    overdue: {
      background: "var(--destructive-soft)",
      color: "var(--destructive)",
    },
    today: { background: "var(--warning-soft)", color: "var(--warning)" },
    soon: { background: "var(--warning-soft)", color: "var(--warning)" },
    upcoming: { background: "var(--muted)", color: "var(--muted-foreground)" },
  }[dueStatus];

  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-11 font-semibold"
        style={{
          background: `color-mix(in oklch, ${color} 18%, var(--muted))`,
          color,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-13 font-medium">{name}</p>
        <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
          {RECURRING_FREQUENCY_LABELS[expense.frequency]}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-10 font-medium"
        style={dueBadgeStyle}
      >
        {dueLabel}
      </span>
      <p className="shrink-0 text-xs sm:text-13 font-semibold tabular-nums">
        {formatCurrency(expense.amount)}
      </p>
    </div>
  );
}

export async function UpcomingRecurringSection() {
  const { upcomingRecurring } = await getRecentAndUpcomingData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = upcomingRecurring.filter(
    (r) => new Date(r.next_due_date + "T00:00:00") < today,
  ).length;

  return (
    <>
      {/* ── Mobile layout ─────────────────────────────────────── */}
      <div className="sm:hidden flex flex-col">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">
              Upcoming recurring
            </span>
            {overdueCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-10 font-medium"
                style={{
                  background: "var(--destructive-soft)",
                  color: "var(--destructive)",
                }}
              >
                {overdueCount} overdue
              </span>
            )}
          </div>
          <Link
            href="/recurring"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {upcomingRecurring.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No active recurring expenses.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {upcomingRecurring.map((r) => (
              <MobileUpcomingRecurringCard key={r.id} expense={r} />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop layout (sm+) ──────────────────────────────── */}
      <div className="hidden sm:flex flex-col rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
          <div>
            <TypographyH5>Upcoming recurring</TypographyH5>
            {upcomingRecurring.length > 0 && (
              <p className="mt-0.5 text-11 sm:text-xs text-muted-foreground">
                {upcomingRecurring.length} active subscription{upcomingRecurring.length !== 1 ? "s" : ""} · {formatCurrency(upcomingRecurring.reduce((s, r) => s + r.amount, 0))}/mo
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/recurring"
              className="flex items-center gap-1 text-11 sm:text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight size={11} />
            </Link>
            {overdueCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-10 font-medium"
                style={{
                  background: "var(--destructive-soft)",
                  color: "var(--destructive)",
                }}
              >
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        {upcomingRecurring.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 px-4">
            <p className="text-xs text-muted-foreground">
              No active recurring expenses.
            </p>
          </div>
        ) : (
          <>
            <UpcomingTimeline items={upcomingRecurring} />
            <div className="border-t border-border px-4 sm:px-5 pt-3 pb-4 sm:pb-5 flex flex-col divide-y">
              {upcomingRecurring.map((r) => (
                <UpcomingRecurringRow key={r.id} expense={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function UpcomingRecurringSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="h-2.5 w-14 rounded bg-muted" />
      </div>
      <div className="flex flex-col divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="size-8 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-2.5 w-36 rounded bg-muted" />
            </div>
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
