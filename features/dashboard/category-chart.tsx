"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { formatCurrency } from "@/lib/format";
import { CategoryIcon } from "@/lib/category-icons";
import type { CategoryStat } from "@/actions/dashboard";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategoryStat & { percentage: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border bg-card-elevated px-3 py-2 shadow-md text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        <CategoryIcon
          icon={d.icon}
          size={12}
          className="text-muted-foreground"
        />
        <span className="font-semibold text-foreground">{d.name}</span>
      </div>
      <p className="text-muted-foreground">
        {formatCurrency(d.amount)}{" "}
        <span className="text-foreground font-medium">
          ({d.percentage.toFixed(1)}%)
        </span>
      </p>
    </div>
  );
}

// ─── Chart color hook ─────────────────────────────────────────────────────────
// SVG fill attributes can't use CSS var() — resolve them from getComputedStyle.
// Dark-theme oklch values are used as SSR / initial-render fallbacks.
const CHART_COLOR_FALLBACKS = [
  "oklch(0.871 0.15 154.449)",
  "oklch(0.723 0.219 149.579)",
  "oklch(0.627 0.194 149.214)",
  "oklch(0.527 0.154 150.069)",
  "oklch(0.448 0.119 151.328)",
];

function useChartColors() {
  const [colors, setColors] = useState(CHART_COLOR_FALLBACKS);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const resolved = [1, 2, 3, 4, 5].map((i) =>
      style.getPropertyValue(`--chart-${i}`).trim(),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (resolved.every(Boolean)) setColors(resolved);
  }, []);

  return colors;
}

// ─── Component ────────────────────────────────────────────────────────────────

type CategoryChartProps = {
  data: CategoryStat[];
  total: number;
  month?: string;
};

export function CategoryChart({ data, total, month }: CategoryChartProps) {
  const chartColors = useChartColors();

  const enriched = data.map((d, i) => ({
    ...d,
    percentage: total > 0 ? (d.amount / total) * 100 : 0,
    chartColor: chartColors[i % chartColors.length],
  }));

  return (
    <div className="flex flex-col px-4 sm:px-5 pb-4 sm:pb-5 pt-3 gap-4">
      {/* Donut with center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie
              data={enriched}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={enriched.length > 1 ? 2 : 0}
              dataKey="amount"
              strokeWidth={0}
            >
              {enriched.map((entry, index) => (
                <Cell key={index} fill={entry.chartColor} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-11 text-muted-foreground">Total spent</span>
          <span className="text-22 font-semibold tabular-nums tracking-[-0.025em] leading-tight mt-0.5">
            {formatCurrency(total)}
          </span>
          {month && (
            <span className="text-11 text-muted-foreground mt-0.5">
              {month} · {data.length} categor{data.length === 1 ? "y" : "ies"}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {enriched.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center gap-2 text-xs sm:text-13"
          >
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ background: cat.chartColor }}
            />
            <span className="flex flex-1 items-center gap-1 truncate text-muted-foreground">
              <span className="truncate">{cat.name}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">
              {formatCurrency(cat.amount)}
            </span>
            <span className="shrink-0 w-8 text-right text-muted-foreground tabular-nums">
              {cat.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
