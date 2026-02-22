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
