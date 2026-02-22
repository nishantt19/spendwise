"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { formatCurrency } from "@/lib/format";
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
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        {d.icon && <span>{d.icon}</span>}
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

// ─── Component ────────────────────────────────────────────────────────────────

type CategoryChartProps = {
  data: CategoryStat[];
  total: number;
};

export function CategoryChart({ data, total }: CategoryChartProps) {
  // Add percentage to each item
  const enriched = data.map((d) => ({
    ...d,
    percentage: total > 0 ? (d.amount / total) * 100 : 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Donut */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={enriched}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={enriched.length > 1 ? 2 : 0}
            dataKey="amount"
            strokeWidth={0}
          >
            {enriched.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        {enriched.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ background: cat.color }}
            />
            <span className="flex-1 truncate text-muted-foreground">
              {cat.icon ? `${cat.icon} ` : ""}
              {cat.name}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">
              {formatCurrency(cat.amount)}
            </span>
            <span className="shrink-0 w-9 text-right text-muted-foreground">
              {cat.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
