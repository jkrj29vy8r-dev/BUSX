import { GitBranch, Layers, QrCode, Radio, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/nav";
import { BentoTile } from "@/components/bento-tile";
import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Nav />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <div className="mb-8 flex flex-col gap-3">
          <Badge variant="accent" className="w-fit">
            <Radio className="size-3" strokeWidth={2} />
            Live seat inventory across every operator
          </Badge>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Intercity travel, booked in seconds.
          </h1>
          <p className="max-w-lg text-md text-ink-secondary">
            Search every stop on the route — not just the endpoints — and pay
            only for the segment you ride.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(0,auto)]">
          <BentoTile glow className="lg:col-span-7 lg:row-span-2">
            <SearchForm />
          </BentoTile>

          <BentoTile className="lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-accent-muted text-accent">
                  <Layers className="size-4.5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-3 text-md font-semibold text-ink">Seat 12 can be sold twice</h3>
                <p className="mt-1 text-sm text-ink-secondary">
                  Once for Piatra Neamț → Roman, and again for Otopeni → București
                  — same trip, same seat, non-overlapping segments. No blocked
                  inventory.
                </p>
              </div>
            </div>
          </BentoTile>

          <BentoTile className="lg:col-span-5">
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-positive-muted text-positive">
              <ShieldCheck className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-semibold text-ink">Verified carriers only</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Every operator is identity-checked before their routes go live.
              Look for the verified badge at checkout.
            </p>
          </BentoTile>

          <BentoTile className="lg:col-span-4">
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-white/[0.06] text-ink">
              <GitBranch className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-semibold text-ink">N-stop route graphs</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Routes aren&apos;t A→B. Search any stop pair on a multi-city line and
              get priced for exactly that leg.
            </p>
          </BentoTile>

          <BentoTile className="lg:col-span-4">
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-white/[0.06] text-ink">
              <QrCode className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-semibold text-ink">Boards without signal</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Every ticket QR is cryptographically signed. Conductors verify it
              offline — no connectivity required at the door.
            </p>
          </BentoTile>

          <BentoTile className="lg:col-span-4">
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-white/[0.06] text-ink">
              <Radio className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-semibold text-ink">Live seat map</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Seats grey out the instant another passenger holds them.
              Ten-minute checkout window, no overbooking.
            </p>
          </BentoTile>
        </div>
      </main>
    </div>
  );
}
