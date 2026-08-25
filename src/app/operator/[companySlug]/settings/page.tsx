"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Check, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOperatorProfile, useUpdateOperatorProfile } from "@/hooks/use-operator";
import type { EmergencyContact } from "@/types/database";

const MAX_LOGO_BYTES = 500_000;

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-9 w-full border border-border-dark bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-ink-onDarkSecondary/60 focus:border-electric"
    />
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-onDarkSecondary">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-onDarkSecondary/70">{hint}</span>}
    </label>
  );
}

export default function OperatorSettingsPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { data: profile, isLoading } = useOperatorProfile(companySlug);
  const mutation = useUpdateOperatorProfile(companySlug);

  const [legalName, setLegalName] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [brandPrimary, setBrandPrimary] = useState("#0066FF");
  const [brandSecondary, setBrandSecondary] = useState("#00D084");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLegalName(profile.legalName ?? "");
    setFiscalCode(profile.fiscalCode ?? "");
    setSupportPhone(profile.supportPhone ?? "");
    setSupportEmail(profile.supportEmail ?? "");
    setBrandPrimary(profile.brandPrimaryColor);
    setBrandSecondary(profile.brandSecondaryColor);
    setLogoUrl(profile.logoUrl);
    setContacts(profile.emergencyContacts.length > 0 ? profile.emergencyContacts : []);
  }, [profile]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    if (!file.type.startsWith("image/")) {
      setLogoError("Logo-ul trebuie să fie un fișier imagine");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(`Logo-ul trebuie să fie sub ${Math.round(MAX_LOGO_BYTES / 1000)}KB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function updateContact(index: number, patch: Partial<EmergencyContact>) {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      legalName: legalName || null,
      fiscalCode: fiscalCode || null,
      supportPhone: supportPhone || null,
      supportEmail: supportEmail || null,
      logoUrl,
      brandPrimaryColor: brandPrimary as never,
      brandSecondaryColor: brandSecondary as never,
      emergencyContacts: contacts.filter((c) => c.name.trim() || c.phone.trim()),
    });
  }

  return (
    <main className="flex-1 px-8 py-8">
      <h1 className="text-lg font-bold tracking-tight text-white">Profil operator</h1>
      <p className="mt-1 text-[13px] text-ink-onDarkSecondary">Identitate juridică, brand și pe cine sună un șofer atunci când ceva nu merge bine.</p>

      {isLoading && <div className="mt-6 h-96 animate-pulse border border-border-dark bg-surface-dark" />}

      {profile && (
        <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-8">
          <section className="border border-border-dark p-5">
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Identitate</h2>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-16 items-center justify-center overflow-hidden border border-border-dark bg-white/[0.03]">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo operator" className="size-full object-contain" />
                  ) : (
                    <span className="text-lg font-bold text-ink-onDarkSecondary">{profile.name.slice(0, 1)}</span>
                  )}
                </div>
                <label className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#6FA6FF] hover:text-white">
                  <Upload className="size-3" strokeWidth={2} />
                  Încarcă
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-4">
                <Field label="Denumire înregistrată">
                  <DarkInput value={profile.name} disabled />
                </Field>
                <Field label="Denumire juridică">
                  <DarkInput value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="S.C. Moldova Express S.R.L." />
                </Field>
                <Field label="CUI / CIF" hint="Cod de înregistrare fiscală">
                  <DarkInput value={fiscalCode} onChange={(e) => setFiscalCode(e.target.value)} placeholder="RO18547290" />
                </Field>
                <Field label="Telefon suport">
                  <DarkInput value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="+40 21 555 0100" />
                </Field>
                <Field label="Email suport" hint="Afișat pasagerilor, nu șoferilor">
                  <DarkInput type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="hello@carrier.ro" />
                </Field>
              </div>
            </div>
            {logoError && <p className="mt-2 text-xs text-danger">{logoError}</p>}
          </section>

          <section className="border border-border-dark p-5">
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Culori de brand</h2>
            <div className="flex gap-6">
              <Field label="Principală">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandPrimary}
                    onChange={(e) => setBrandPrimary(e.target.value)}
                    className="size-9 cursor-pointer border border-border-dark bg-transparent p-1"
                  />
                  <span className="font-mono text-xs text-ink-onDarkSecondary">{brandPrimary.toUpperCase()}</span>
                </div>
              </Field>
              <Field label="Secundară">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandSecondary}
                    onChange={(e) => setBrandSecondary(e.target.value)}
                    className="size-9 cursor-pointer border border-border-dark bg-transparent p-1"
                  />
                  <span className="font-mono text-xs text-ink-onDarkSecondary">{brandSecondary.toUpperCase()}</span>
                </div>
              </Field>
            </div>
          </section>

          <section className="border border-border-dark p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-ink-onDarkSecondary">Dispecerat de urgență pentru șoferi</h2>
              <button
                type="button"
                onClick={() => setContacts((prev) => [...prev, { name: "", phone: "", role: "Dispecer" }])}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#6FA6FF] hover:text-white"
              >
                <Plus className="size-3" strokeWidth={2.5} />
                Adaugă contact
              </button>
            </div>
            <p className="mb-4 text-[11px] text-ink-onDarkSecondary/70">
              Pe cine sună un șofer de pe drum — defecțiuni, incidente medicale, perturbări de traseu. Nu este afișat pasagerilor.
            </p>

            {contacts.length === 0 && (
              <div className="flex items-center gap-2 border border-dashed border-border-dark px-3 py-4 text-xs text-ink-onDarkSecondary">
                <AlertTriangle className="size-3.5 shrink-0 text-warning" strokeWidth={1.75} />
                Niciun dispecer înregistrat — șoferii nu au pe cine suna în caz de urgență.
              </div>
            )}

            <div className="flex flex-col gap-2">
              {contacts.map((contact, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_120px_auto] items-center gap-2">
                  <DarkInput placeholder="Nume" value={contact.name} onChange={(e) => updateContact(i, { name: e.target.value })} />
                  <DarkInput
                    placeholder="+40 7XX XXX XXX"
                    value={contact.phone}
                    onChange={(e) => updateContact(i, { phone: e.target.value })}
                  />
                  <DarkInput placeholder="Rol" value={contact.role} onChange={(e) => updateContact(i, { role: e.target.value })} />
                  <button
                    type="button"
                    onClick={() => setContacts((prev) => prev.filter((_, idx) => idx !== i))}
                    className="flex size-9 items-center justify-center text-ink-onDarkSecondary hover:text-danger"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {mutation.isError && (
            <div className="flex items-center gap-2 border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
              <AlertTriangle className="size-4 shrink-0" strokeWidth={1.75} />
              {mutation.error instanceof Error ? mutation.error.message : "Salvarea a eșuat"}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="electric" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" strokeWidth={2.5} />}
              Salvează profilul
            </Button>
            {mutation.isSuccess && !mutation.isPending && <span className="text-xs text-emerald">Salvat</span>}
          </div>
        </form>
      )}
    </main>
  );
}
