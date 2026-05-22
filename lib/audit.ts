/**
 * Structured audit logger for all financial mutations and auth events.
 *
 * ┌─ Design goals ───────────────────────────────────────────────────────────────┐
 * │ • Never throws — logging must never crash a mutation.                        │
 * │ • Zero runtime dependencies.                                                 │
 * │ • Development: human-readable console lines.                                 │
 * │ • Production: single-line JSON → stdout → picked up by platform log          │
 * │   aggregators (Vercel, Render, Railway, AWS CloudWatch, etc.).               │
 * │                                                                              │
 * │ To forward logs to a dedicated service (Axiom, DataDog, Sentry, etc.),      │
 * │ replace the body of `emit()` below. No call sites need to change.           │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "soft_delete"
  | "toggle"
  | "sign_in"
  | "sign_up"
  | "sign_out"
  | "password_reset";

export type AuditEntity =
  | "transaction"
  | "income_source"
  | "recurring_expense"
  | "category"
  | "auth";

export interface AuditEvent {
  action: AuditAction;
  entity: AuditEntity;
  /**
   * The primary ID of the affected record.
   * For auth events use the user ID; for pre-auth failures use "unauthenticated".
   */
  entity_id: string;
  /** The authenticated user performing the action. */
  user_id: string;
  /**
   * Optional structured context. Keep PII out: no passwords, no raw tokens.
   * Amounts, names, statuses, and counts are fine.
   */
  details?: Record<string, unknown>;
}

// ─── Internal emitter (swap this to change the sink) ─────────────────────────

function emit(event: AuditEvent): void {
  const entry = {
    type: "AUDIT" as const,
    ts: new Date().toISOString(),
    ...event,
  };

  if (process.env.NODE_ENV !== "production") {
    const detail = event.details
      ? `  ${JSON.stringify(event.details)}`
      : "";
    // Pad columns for readable alignment in the dev console
    console.log(
      `\x1b[36m[AUDIT]\x1b[0m ${entry.ts}  ` +
        `${event.action.toUpperCase().padEnd(13)} ` +
        `${event.entity.padEnd(20)} ` +
        `${event.entity_id.slice(0, 8)}  ` +
        `user:${event.user_id.slice(0, 8)}${detail}`,
    );
  } else {
    // Single JSON line — parseable by log aggregators.
    console.log(JSON.stringify(entry));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a mutation or auth audit event. Fire-and-forget — never throws.
 *
 * @example
 * auditLog({ action: "create", entity: "transaction", entity_id: data.id, user_id: user.id, details: { amount: data.amount } });
 */
export function auditLog(event: AuditEvent): void {
  try {
    emit(event);
  } catch {
    // Intentionally swallowed — logging must never crash a mutation.
  }
}
