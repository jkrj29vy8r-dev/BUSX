import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = ["Rezervare instantă în 30s", "Bilet QR pe telefon", "50+ operatori validați"];

/** The trust strip beneath the search dock — plain checkmarks stating what
 * the product actually does, not a badge wall. */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5", className)}>
      {ITEMS.map((item) => (
        <div key={item} className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary">
          <CheckCircle2 className="size-4 shrink-0 text-electric" strokeWidth={2} />
          {item}
        </div>
      ))}
    </div>
  );
}
