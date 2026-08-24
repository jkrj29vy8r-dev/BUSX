"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FleetBuilder } from "@/components/operator/fleet-builder";

export default function NewVehiclePage() {
  const { companySlug } = useParams<{ companySlug: string }>();

  return (
    <main className="flex-1 px-8 py-8">
      <Link
        href={`/operator/${companySlug}/fleet`}
        className="mb-4 flex w-fit items-center gap-1 text-xs font-semibold text-ink-onDarkSecondary transition-colors hover:text-white"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2.25} />
        Fleet
      </Link>
      <h1 className="mb-6 text-lg font-bold tracking-tight text-white">Build a vehicle</h1>
      <FleetBuilder companySlug={companySlug} />
    </main>
  );
}
