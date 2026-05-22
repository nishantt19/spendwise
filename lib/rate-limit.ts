/**
 * In-memory sliding window rate limiter.
 *
 * ┌─ IMPORTANT — serverless caveat ────────────────────────────────────────────┐
 * │ This store is process-scoped. On platforms that spin up isolated function   │
 * │ instances per request (Vercel Edge, AWS Lambda, etc.) each instance has its │
 * │ own empty store, so limits are per-instance rather than global.             │
 * │                                                                             │
 * │ For true distributed rate limiting, replace `limiter.check()` with a call  │
 * │ to @upstash/ratelimit backed by Upstash Redis — the `rateLimit()` public   │
 * │ API below stays identical, only the implementation changes.                 │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * On a standard Node.js server / single-process deployment this works correctly.
 */

// ─── Internal sliding window implementation ───────────────────────────────────

class SlidingWindowLimiter {
  /**
   * Each key maps to a sorted array of request timestamps (ms since epoch).
   * Only timestamps within the current window are kept.
   */
  private readonly store = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1_000; // every 5 min

  check(
    key: string,
    limit: number,
    windowMs: number,
  ): { success: boolean; remaining: number; resetAt: number } {
    this.maybeCleanup();

    const now = Date.now();
    const windowStart = now - windowMs;

    // Retain only timestamps inside the current window
    const timestamps = (this.store.get(key) ?? []).filter((t) => t > windowStart);

    const resetAt = (timestamps[0] ?? now) + windowMs;

    if (timestamps.length >= limit) {
      this.store.set(key, timestamps);
      return { success: false, remaining: 0, resetAt };
    }

    timestamps.push(now);
    this.store.set(key, timestamps);
    return { success: true, remaining: limit - timestamps.length, resetAt };
  }

  /** Evict keys whose most-recent request is older than 1 hour. */
  private maybeCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL_MS) return;
    this.lastCleanup = now;

    const staleThreshold = now - 60 * 60 * 1_000;
    for (const [key, ts] of this.store) {
      if (!ts.length || ts[ts.length - 1] < staleThreshold) {
        this.store.delete(key);
      }
    }
  }
}

// Module-level singleton — shared across all requests within the same process.
const limiter = new SlidingWindowLimiter();

// ─── Public API ───────────────────────────────────────────────────────────────

export type RateLimitConfig = {
  /** Maximum number of requests allowed inside the window. */
  limit: number;
  /** Length of the sliding window in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  /** true if the request is within quota. */
  success: boolean;
  /** Requests remaining before the limit is hit. */
  remaining: number;
  /** Epoch ms when the oldest in-window request expires. */
  resetAt: number;
  /** How many seconds the caller must wait before retrying. */
  retryAfterSeconds: number;
};

/**
 * Check whether `key` is within its rate-limit quota.
 *
 * @example
 * const result = rateLimit(`sign_in:${ip}`, RATE_LIMITS.SIGN_IN);
 * if (!result.success) {
 *   return { status: "error", message: `Too many attempts. Try again in ${result.retryAfterSeconds}s.` };
 * }
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const { success, remaining, resetAt } = limiter.check(
    key,
    config.limit,
    config.windowMs,
  );
  const retryAfterSeconds = Math.ceil(Math.max(0, resetAt - Date.now()) / 1_000);
  return { success, remaining, resetAt, retryAfterSeconds };
}

// ─── Pre-configured limits ────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** 10 sign-in attempts per 15 minutes per IP. */
  SIGN_IN: { limit: 10, windowMs: 15 * 60 * 1_000 } satisfies RateLimitConfig,
  /** 5 sign-up attempts per hour per IP. */
  SIGN_UP: { limit: 5, windowMs: 60 * 60 * 1_000 } satisfies RateLimitConfig,
  /** 3 forgot-password requests per 15 minutes per IP + email. */
  FORGOT_PASSWORD: { limit: 3, windowMs: 15 * 60 * 1_000 } satisfies RateLimitConfig,
  /** 3 resend-verification emails per 15 minutes per email. */
  RESEND_VERIFICATION: { limit: 3, windowMs: 15 * 60 * 1_000 } satisfies RateLimitConfig,
  /** 3 reset-password submissions per 15 minutes per IP. */
  RESET_PASSWORD: { limit: 3, windowMs: 15 * 60 * 1_000 } satisfies RateLimitConfig,
} as const;
