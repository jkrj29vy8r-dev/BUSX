"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, LayoutDashboard, GitBranch, CalendarClock, ExternalLink, ShieldCheck } from "lucide-react";
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
    { href: `${base}/trips`, label: "Trips", icon: CalendarClock, exact: false },
  ];
}

export function OperatorShell({ companySlug, children }: OperatorShellProps) {
  const pathname = usePathname();
  const { data: company } = useOperatorCompany(companySlug);
  const items = navItems(companySlug);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border-dark bg-surface-dark texture-noise">
        <Link href="/" className="flex items-center gap-2 px-5 py-5 text-ink-onDark">
          <span className="flex size-7 items-center justify-center rounded-md bg-electric text-white">
            <Bus className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-bold tracking-tight">BUSX</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">
            Operator
          </span>
        </Link>

        <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-lg border border-border-dark bg-white/[0.04] px-3 py-2.5">
          {company ? (
            <>
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                style={{ backgroundColor: company.brandPrimaryColor }}
              >
                {company.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink-onDark">{company.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-ink-onDarkSecondary">
                  {company.isVerified && <ShieldCheck className="size-3" strokeWidth={2.25} />}
                  {company.status}
                </div>
              </div>
            </>
          ) : (
            <div className="h-9 w-full animate-pulse rounded bg-white/5" />
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {items.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-electric text-white" : "text-ink-onDarkSecondary hover:bg-white/[0.06] hover:text-ink-onDark"
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="mx-3 mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-ink-onDarkSecondary transition-colors hover:bg-white/[0.06] hover:text-ink-onDark"
        >
          <ExternalLink className="size-3.5" strokeWidth={1.75} />
          View passenger site
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">{children}</div>
    </div>
  );
}
