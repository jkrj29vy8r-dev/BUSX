"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, LayoutDashboard, GitBranch, CalendarClock, Truck, Settings, ExternalLink, ShieldCheck, ScanLine } from "lucide-react";
import { useOperatorCompany } from "@/hooks/use-operator";
import { cn } from "@/lib/cn";

interface OperatorShellProps {
  companySlug: string;
  children: ReactNode;
}

function navItems(companySlug: string) {
  const base = `/operator/${companySlug}`;
  return [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${base}/routes`, label: "Routes & pricing", icon: GitBranch, exact: false },
    { href: `${base}/fleet`, label: "Fleet", icon: Truck, exact: false },
    { href: `${base}/trips`, label: "Trips", icon: CalendarClock, exact: false },
    { href: `${base}/settings`, label: "Carrier profile", icon: Settings, exact: false },
  ];
}

/**
 * Dashboard shell — Vercel Analytics / Stripe Dashboard / Raycast register:
 * one flat dark canvas (#0B0F17) for both chrome and content, depth comes
 * from hairline borders and a single lighter "raised" surface for cards,
 * not from color variety. Sharp corners, dense type, no decorative filler.
 */
export function OperatorShell({ companySlug, children }: OperatorShellProps) {
  const pathname = usePathname();
  const { data: company } = useOperatorCompany(companySlug);
  const items = navItems(companySlug);

  return (
    <div className="flex min-h-screen bg-surface-dark text-ink-onDark">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border-dark">
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-6 items-center justify-center rounded bg-electric text-white">
            <Bus className="size-3.5" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-bold tracking-tight">BUSX</span>
          <span className="ml-auto rounded border border-border-dark px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">
            Operator
          </span>
        </Link>

        <div className="mx-3 mb-4 flex items-center gap-2.5 border border-border-dark px-3 py-2.5">
          {company ? (
            <>
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
                style={{ backgroundColor: company.brandPrimaryColor }}
              >
                {company.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">{company.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-ink-onDarkSecondary">
                  {company.isVerified && <ShieldCheck className="size-2.5" strokeWidth={2.25} />}
                  {company.status}
                </div>
              </div>
            </>
          ) : (
            <div className="h-8 w-full animate-pulse bg-white/5" />
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-px px-2">
          {items.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive ? "bg-white/[0.08] text-white" : "text-ink-onDarkSecondary hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-px px-2 pb-4">
          <Link
            href={`/conductor/${companySlug}`}
            className="flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px] font-medium text-emerald transition-colors hover:bg-emerald/10"
          >
            <ScanLine className="size-3.5" strokeWidth={1.75} />
            Conductor scanner
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px] font-medium text-ink-onDarkSecondary transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
            Passenger site
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
