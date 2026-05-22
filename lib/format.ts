/**
 * Formatting utilities used across the app.
 * All functions are pure — safe to call in both server and client components.
 */

// ─── Locale / timezone constants ──────────────────────────────────────────────

/** BCP-47 locale tag used throughout the app (Indian English). */
export const APP_LOCALE = "en-IN";

/** IANA timezone used for date-boundary calculations. */
export const APP_TIMEZONE = "Asia/Kolkata";

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number as a plain integer string in the app locale (no currency symbol).
 * Use this for "split symbol" displays where ₹ is rendered separately in a smaller font.
 * e.g. 38420 → "38,420"
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/**
 * Converts a "YYYY-MM-DD" date string to a human-readable group header.
 * e.g. "Today", "Yesterday", "Mon, 19 Jan", "15 Jan 2025"
 */
export function formatDateHeader(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  // Use IST for "today" so date boundaries match Indian time
  const today = new Date(`${todayISO()}T00:00:00`);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  const isSameYear = date.getFullYear() === today.getFullYear();

  return date.toLocaleDateString(APP_LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
}

/**
 * Formats a "YYYY-MM-DD" date string into a day-group label that always
 * includes the short date, e.g.:
 *   today      → "Today · 22 May"
 *   yesterday  → "Yesterday · 21 May"
 *   other      → "Wed · 21 May"
 */
export function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date(`${todayISO()}T00:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dateLabel = d.toLocaleDateString(APP_LOCALE, {
    day: "numeric",
    month: "short",
  });

  if (d.getTime() === today.getTime()) return `Today · ${dateLabel}`;
  if (d.getTime() === yesterday.getTime()) return `Yesterday · ${dateLabel}`;

  const weekday = d.toLocaleDateString(APP_LOCALE, { weekday: "short" });
  return `${weekday} · ${dateLabel}`;
}

/**
 * Formats a "YYYY-MM-DD" string to a short display date.
 * e.g. "22 Feb"
 */
export function formatDateShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(APP_LOCALE, {
    day: "numeric",
    month: "short",
  });
}

/**
 * Returns today's date as a "YYYY-MM-DD" string in Indian Standard Time (IST, UTC+5:30).
 */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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
  // Use IST for "today" so date boundaries match Indian time
  const today = new Date(`${todayISO()}T00:00:00`);

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
    label: date.toLocaleDateString(APP_LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    status: "upcoming",
  };
}
