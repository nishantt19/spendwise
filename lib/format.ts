/**
 * Formatting utilities used across the app.
 * All functions are pure — safe to call in both server and client components.
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/**
 * Converts a "YYYY-MM-DD" date string to a human-readable group header.
 * e.g. "Today", "Yesterday", "Mon, 19 Jan", "15 Jan 2025"
 */
export function formatDateHeader(dateStr: string): string {
  // Parse as local midnight to avoid UTC offset shifting the day
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  const isSameYear = date.getFullYear() === today.getFullYear();

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
}

/**
 * Formats a "YYYY-MM-DD" string to a short display date.
 * e.g. "22 Feb"
 */
export function formatDateShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Returns today's date as a "YYYY-MM-DD" string (for default date inputs).
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Recurring due date ───────────────────────────────────────────────────────

export type DueDateStatus = "overdue" | "today" | "soon" | "upcoming";

/**
 * Returns a human-readable label and status for a recurring next_due_date.
 * e.g. { label: "Due today", status: "today" }
 */
export function formatNextDueDate(dateStr: string): {
  label: string;
  status: DueDateStatus;
} {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      label: `Overdue · ${abs} day${abs !== 1 ? "s" : ""}`,
      status: "overdue",
    };
  }
  if (diffDays === 0) return { label: "Due today", status: "today" };
  if (diffDays === 1) return { label: "Due tomorrow", status: "soon" };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, status: "soon" };

  return {
    label: date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    }),
    status: "upcoming",
  };
}
