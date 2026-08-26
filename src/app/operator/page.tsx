"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useOperatorCompanies } from "@/hooks/use-operator";
import { BusxLogo } from "@/components/brand/busx-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const STATUS_LABELS: Record<string, string> = {
  pending: "în așteptare",
  active: "activ",
  suspended: "suspendat",
  terminated: "încheiat",
};

/**
 * Stand-in for a login redirect: this environment has no live Supabase Auth
 * project to authenticate an operator_admin session against. Email and
 * access code are collected here as the shape of that future flow, but the
 * request that actually resolves a session is still "pick your company" —
 * every request past this point still scopes strictly to the chosen company
 * (see src/lib/services/operator.service.ts). Swapping the company picker
 * for a real credential check against `profiles.company_id` is the only
 * change needed once a Supabase Auth project is wired up.
 */
export default function OperatorPickerPage() {
  const router = useRouter();
  const { data: companies, isLoading } = useOperatorCompanies();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);

  const selected = companies?.find((c) => c.id === companyId) ?? null;
  const canContinue = email.trim().length > 0 && code.trim().length > 0 && selected !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    router.push(`/operator/${selected.slug}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BusxLogo className="h-7 w-auto" variant="light" />
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Panou operator</h1>
          <p className="text-sm text-ink-secondary">Autentifică-te pentru a continua în dashboard.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-border bg-white p-6 shadow-subtle"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-secondary">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nume@operator.ro"
              className="h-11 rounded-lg border border-border bg-canvas px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-electric focus:bg-white focus:ring-2 focus:ring-electric/15"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-secondary">Cod de acces</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Cod primit de la BUSX"
              className="h-11 rounded-lg border border-border bg-canvas px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-electric focus:bg-white focus:ring-2 focus:ring-electric/15"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-secondary">Operator</span>
            <div className="flex flex-col gap-2">
              {isLoading &&
                [0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-canvas" />)}

              {companies?.map((company) => {
                const isSelected = company.id === companyId;
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => setCompanyId(company.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150 ease-snap",
                      isSelected
                        ? "border-electric bg-electric/5 shadow-subtle"
                        : "border-border hover:border-border-strong hover:bg-canvas"
                    )}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                      style={{ backgroundColor: company.brandPrimaryColor }}
                    >
                      {company.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                        {company.name}
                        {company.isVerified && <ShieldCheck className="size-3.5 shrink-0 text-electric" strokeWidth={2.25} />}
                      </div>
                      <div className="text-xs capitalize text-ink-tertiary">{STATUS_LABELS[company.status] ?? company.status}</div>
                    </div>
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected ? "border-electric bg-electric" : "border-border"
                      )}
                    >
                      {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" variant="electric" size="lg" className="mt-1 w-full" disabled={!canContinue}>
            Continuă în Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}
