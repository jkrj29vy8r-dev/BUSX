"use client";

import Link from "next/link";
import { Bus, ShieldCheck } from "lucide-react";
import { useOperatorCompanies } from "@/hooks/use-operator";

/**
 * Stand-in for a login redirect: this environment has no live Supabase Auth
 * project to authenticate an operator_admin session against, so the
 * dashboard is reached by picking a company here instead. Every request
 * past this point still scopes strictly to the chosen company (see
 * src/lib/services/operator.service.ts) — swapping this picker for a real
 * `/login` that resolves `profiles.company_id` is the only change needed
 * once a Supabase project is wired up.
 */
export default function OperatorPickerPage() {
  const { data: companies, isLoading } = useOperatorCompanies();

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-electric text-white">
            <Bus className="size-5" strokeWidth={2.25} />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Operator dashboard</h1>
          <p className="text-sm text-ink-secondary">Choose your carrier to continue.</p>
        </div>

        <div className="flex flex-col gap-2">
          {isLoading &&
            [0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-white" />)}

          {companies?.map((company) => (
            <Link
              key={company.id}
              href={`/operator/${company.slug}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-subtle transition-all duration-150 ease-snap hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded text-sm font-bold text-white"
                style={{ backgroundColor: company.brandPrimaryColor }}
              >
                {company.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                  {company.name}
                  {company.isVerified && <ShieldCheck className="size-3.5 shrink-0 text-electric" strokeWidth={2.25} />}
                </div>
                <div className="text-xs capitalize text-ink-tertiary">{company.status}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
