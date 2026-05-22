import { CreditCard02 } from "@untitledui/icons";
import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background text-foreground font-sans">
      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div
        className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border bg-card isolate"
        style={{ padding: "52px 60px 36px" }}
      >
        {/* Ambient glow */}
        <div
          className="absolute pointer-events-none -z-10"
          style={{
            inset: "-10% -10% auto -10%",
            height: "70%",
            background:
              "radial-gradient(60% 70% at 20% 0%, color-mix(in oklch, var(--primary) 26%, transparent) 0%, transparent 60%)",
          }}
        />
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--border-strong) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            opacity: 0.4,
            maskImage:
              "radial-gradient(80% 80% at 30% 30%, black, transparent 90%)",
            WebkitMaskImage:
              "radial-gradient(80% 80% at 30% 30%, black, transparent 90%)",
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="relative overflow-hidden flex items-center justify-center rounded-[11px] text-primary-foreground"
            style={{
              width: 44,
              height: 44,
              background:
                "linear-gradient(155deg, var(--primary), color-mix(in oklch, var(--primary) 70%, black))",
              boxShadow:
                "0 0 0 1px color-mix(in oklch, var(--primary) 30%, transparent), 0 8px 18px -4px color-mix(in oklch, var(--primary) 55%, transparent)",
            }}
          >
            {/* Inner shine */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.22), transparent 50%)",
              }}
            />
            <CreditCard02 className="size-5.5 relative z-10" />
          </div>
          <span
            className="font-semibold tracking-tight"
            style={{ fontSize: 18, letterSpacing: "-0.01em" }}
          >
            SpendWise
          </span>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 540, marginTop: 12 }}>
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2"
            style={{
              padding: "5px 12px 5px 10px",
              borderRadius: 999,
              background:
                "color-mix(in oklch, var(--primary) 10%, transparent)",
              border:
                "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
              color: "var(--primary)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "var(--primary)",
                boxShadow:
                  "0 0 0 3px color-mix(in oklch, var(--primary) 25%, transparent)",
                flexShrink: 0,
              }}
            />
            PERSONAL FINANCE · SIMPLIFIED
          </div>

          {/* Headline */}
          <h1
            className="font-bold"
            style={{
              fontSize: 56,
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
              margin: "24px 0 18px",
              textWrap: "balance",
            }}
          >
            Know where
            <br />
            your money{" "}
            <em
              className="not-italic font-extrabold"
              style={{ color: "var(--primary)" }}
            >
              actually goes.
            </em>
          </h1>

          {/* Subtext */}
          <p
            className="text-muted-foreground"
            style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 480 }}
          >
            Full visibility over every expense, income, and budget — in one
            clean dashboard built for clarity.
          </p>

          {/* Floating preview stack */}
          <div
            className="relative"
            style={{ marginTop: 40, height: 280, maxWidth: 540 }}
          >
            {/* Back card — spending chart */}
            <div
              className="absolute"
              style={{
                top: 0,
                right: 0,
                width: 360,
                height: 200,
                transform: "rotate(2.5deg)",
                zIndex: 1,
                background: "var(--card-elevated)",
                border: "1px solid var(--border-strong)",
                borderRadius: 16,
                boxShadow:
                  "0 24px 40px -16px rgba(0,0,0,0.4), 0 0 0 0.5px oklch(1 0 0 / 4%) inset",
                padding: 16,
              }}
            >
              <div className="flex justify-between items-start" style={{ marginBottom: 4 }}>
                <div>
                  <div
                    className="font-medium"
                    style={{ fontSize: 12 }}
                  >
                    Spending overview
                  </div>
                  <div
                    className="text-muted-foreground"
                    style={{ fontSize: 10.5, marginTop: 2 }}
                  >
                    Last 6 months
                  </div>
                </div>
                <span
                  className="font-medium"
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                  }}
                >
                  +8.2%
                </span>
              </div>
              <svg
                viewBox="0 0 320 120"
                width="100%"
                height={120}
                preserveAspectRatio="none"
                style={{ display: "block", marginTop: 6 }}
              >
                <defs>
                  <linearGradient id="authPrevG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[20, 50, 80].map((y) => (
                  <line
                    key={y}
                    x1={0}
                    x2={320}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="2 4"
                  />
                ))}
                <path
                  d="M0 80 C 40 70, 60 60, 90 55 S 150 35, 180 30 S 230 50, 260 40 S 300 28, 320 22 L 320 100 L 0 100 Z"
                  fill="url(#authPrevG)"
                />
                <path
                  d="M0 80 C 40 70, 60 60, 90 55 S 150 35, 180 30 S 230 50, 260 40 S 300 28, 320 22"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
                <circle
                  cx="320"
                  cy="22"
                  r="3.5"
                  fill="var(--card-elevated)"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
                {["Dec", "Jan", "Feb", "Mar", "Apr", "May"].map((m, i) => (
                  <text
                    key={m}
                    x={i * 64 + 6}
                    y={115}
                    fontSize="9"
                    fill="var(--muted-foreground)"
                  >
                    {m}
                  </text>
                ))}
              </svg>
            </div>

            {/* Front card — this month */}
            <div
              className="absolute"
              style={{
                bottom: 0,
                left: 24,
                width: 320,
                transform: "rotate(-3deg)",
                zIndex: 2,
                background: "var(--card-elevated)",
                border: "1px solid var(--border-strong)",
                borderRadius: 16,
                boxShadow:
                  "0 24px 40px -16px rgba(0,0,0,0.4), 0 0 0 0.5px oklch(1 0 0 / 4%) inset",
                padding: 16,
              }}
            >
              <div
                className="text-muted-foreground"
                style={{ fontSize: 11 }}
              >
                This month · May 2026
              </div>
              <div
                className="flex items-baseline gap-1.5 font-semibold"
                style={{
                  fontSize: 28,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginTop: 6,
                }}
              >
                <span
                  className="text-muted-foreground font-medium"
                  style={{ fontSize: 13 }}
                >
                  ₹
                </span>
                38,420
              </div>
              <div
                className="flex items-center gap-2"
                style={{ marginTop: 12, fontSize: 11 }}
              >
                <span
                  className="inline-flex items-center gap-1 font-medium"
                  style={{
                    padding: "2px 7px",
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    borderRadius: 999,
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                  +12%
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
              <div
                className="rounded-full overflow-hidden bg-muted"
                style={{ marginTop: 14, height: 5 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "62%",
                    background:
                      "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 60%, white))",
                  }}
                />
              </div>
              <div
                className="flex justify-between text-muted-foreground"
                style={{ marginTop: 6, fontSize: 10 }}
              >
                <span>62% of budget left</span>
                <span>11 days to go</span>
              </div>
            </div>

            {/* Corner mini card — recurring */}
            <div
              className="absolute flex items-center gap-2.5"
              style={{
                bottom: 26,
                right: -22,
                width: 220,
                transform: "rotate(5deg)",
                zIndex: 3,
                background: "var(--card-elevated)",
                border: "1px solid var(--border-strong)",
                borderRadius: 16,
                boxShadow:
                  "0 24px 40px -16px rgba(0,0,0,0.4), 0 0 0 0.5px oklch(1 0 0 / 4%) inset",
                padding: "12px",
              }}
            >
              <div
                className="flex items-center justify-center font-semibold shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "var(--destructive-soft)",
                  color: "var(--destructive)",
                  fontSize: 13,
                }}
              >
                N
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium" style={{ fontSize: 12 }}>
                  Netflix
                </div>
                <div
                  style={{ fontSize: 10.5, color: "var(--destructive)", marginTop: 2 }}
                >
                  Due in 2 days
                </div>
              </div>
              <div className="font-semibold ml-auto" style={{ fontSize: 13 }}>
                ₹199
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} SpendWise. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="relative flex flex-col min-h-svh bg-background">
        {/* Theme toggle */}
        <AuthThemeToggle />

        {/* Mobile-only logo */}
        <div className="flex justify-center pt-8 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-lg text-primary-foreground"
              style={{
                width: 28,
                height: 28,
                background:
                  "linear-gradient(155deg, var(--primary), color-mix(in oklch, var(--primary) 70%, black))",
              }}
            >
              <CreditCard02 className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight">
              SpendWise
            </span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* Bottom copyright */}
        <div className="pb-6 text-center">
          <p className="text-muted-foreground/50" style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} SpendWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
