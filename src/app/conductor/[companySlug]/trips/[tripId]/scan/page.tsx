"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { QrScanner } from "@/components/operator/qr-scanner";

export default function ConductorScanPage() {
  const { companySlug, tripId } = useParams<{ companySlug: string; tripId: string }>();
  const router = useRouter();

  return (
    <div className="relative h-screen w-full">
      <QrScanner companySlug={companySlug} tripId={tripId as never} />
      <button
        type="button"
        onClick={() => router.push(`/conductor/${companySlug}`)}
        className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
        aria-label="Înapoi la selecția cursei"
      >
        <ChevronLeft className="size-5" strokeWidth={2} />
      </button>
    </div>
  );
}
