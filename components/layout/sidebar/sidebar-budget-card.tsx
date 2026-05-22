"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { formatCurrency } from "@/lib/format";

type SidebarBudgetCardProps = {
  spent: number;
  expected: number;
};

export function SidebarBudgetCard({ spent, expected }: SidebarBudgetCardProps) {
  const { state, isMobile, isTablet, openMobile } = useSidebar();
  // Show ring only in desktop collapsed or tablet icon rail — NOT in tablet/mobile sheet overlay
  const isCollapsed = state === "collapsed" && !isMobile && !(isTablet && openMobile);

  const remaining = Math.max(0, expected - spent);
  const percentLeft = expected > 0 ? Math.round((remaining / expected) * 100) : 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  if (isCollapsed) {
    const size = 40;
    const cx = size / 2;
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percentLeft / 100) * circumference;

    return (
      // -mx-2 cancels the SidebarGroup's p-2 so the ring gets the full 48px rail width
      <div className="-mx-2 flex items-center justify-center py-1">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx} cy={cx} r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="2.5"
          />
          <circle
            cx={cx} cy={cx} r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
          <text
            x={cx} y={cx + 3.5}
            textAnchor="middle"
            fontSize="8"
            fontWeight="600"
            fill="currentColor"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {percentLeft}%
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-11 text-muted-foreground">Budget remaining</p>
      <p className="mt-1 text-base font-semibold tabular-nums tracking-tight leading-none">
        {expected > 0 ? formatCurrency(remaining) : "No income set"}
      </p>
      <div className="mt-2.5 h-1 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentLeft}%`,
            background: "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 60%, white))",
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-11 text-muted-foreground tabular-nums">
        <span>{percentLeft}% left</span>
        <span>{daysLeft}d to go</span>
      </div>
    </div>
  );
}
