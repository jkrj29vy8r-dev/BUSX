"use client";

import Link from "next/link";
import { ScanLine, ShieldCheck } from "lucide-react";
import { useOperatorCompanies } from "@/hooks/use-operator";

export default function ConductorPickerPage() {
  const { data: companies, isLoading } = useOperatorCompanies();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-dark px-6 text-ink-onDark">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald/15 text-emerald">
            <ScanLine className="size-6" strokeWidth={2} />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Conductor scanner</h1>
          <p className="text-sm text-ink-onDarkSecondary">Choose your carrier to pick a trip.</p>
        </div>

        <div className="flex flex-col gap-2">
          {isLoading && [0, 1].map((i) => <div key={i} className="h-16 animate-pulse border border-border-dark" />)}

          {companies?.map((company) => (
            <Link
              key={company.id}
              href={`/conductor/${company.slug}`}
              className="flex items-center gap-3 border border-border-dark p-4 transition-colors hover:bg-white/[0.04]"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded text-sm font-bold text-white"
                style={{ backgroundColor: company.brandPrimaryColor }}
              >
                {company.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
                  {company.name}
                  {company.isVerified && <ShieldCheck className="size-3.5 shrink-0 text-[#6FA6FF]" strokeWidth={2.25} />}
                </div>
                <div className="text-xs capitalize text-ink-onDarkSecondary">{company.status}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
