import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { CreditCard02, TrendUp01, Wallet01, RefreshCw04 } from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const features: { Icon: IconType; title: string; description: string }[] = [
    {
      Icon: TrendUp01,
      title: "Spending Insights",
      description:
        "Visual breakdowns by category, trend charts, and month-over-month comparisons.",
    },
    {
      Icon: Wallet01,
      title: "Budget Control",
      description:
        "Set limits per category and get alerted before you overspend.",
    },
    {
      Icon: RefreshCw04,
      title: "Recurring Bills",
      description:
        "Track subscriptions and never miss an upcoming bill or payment.",
    },
  ];

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col overflow-hidden border-r border-border">
        {/* ── Background layers ──────────────────────────────────────── */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute -top-48 -left-48 size-120 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-90 rounded-full bg-primary/10 blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 right-0 size-50 rounded-full bg-primary/8 blur-2xl -translate-y-1/4 translate-x-1/2" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,oklch(1_0_0/0.04)_1px,transparent_1px)] bg-size-[28px_28px]" />

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="relative z-10 flex h-full flex-col px-14 py-12">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30 text-primary-foreground">
              <CreditCard02 className="size-5.5" />
            </div>
            <span className="text-[17px] font-bold tracking-tight">SpendWise</span>
          </div>

          {/* ── Copy block — vertically centred ─────────────────────── */}
          <div className="flex flex-1 flex-col justify-center">

            {/* Eyebrow */}
            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="text-1.5xs font-semibold tracking-widest text-primary uppercase">
                Personal Finance · Simplified
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-[52px] font-black leading-[1.08] tracking-[-0.03em]">
              Know where
              <br />
              your money
              <br />
              <span className="text-primary">actually goes.</span>
            </h2>

            {/* Sub-copy */}
            <p className="mt-6 max-w-85 text-[15px] leading-[1.65] text-muted-foreground">
              Full visibility over every expense, income, and budget —
              in one clean dashboard built for clarity.
            </p>

            {/* Divider */}
            <div className="mt-10 h-px w-full bg-border/60" />

            {/* Feature list */}
            <ul className="mt-8 space-y-6">
              {features.map(({ Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="size-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{title}</p>
                    <p className="mt-1 text-error leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <p className="text-1.5xs text-muted-foreground/40">
            © {new Date().getFullYear()} SpendWise. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex flex-col min-h-svh">
        {/* Mobile-only logo */}
        <div className="flex justify-center pt-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
              <CreditCard02 className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight">SpendWise</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <div className="pb-6 text-center">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} SpendWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
