import { GitBranch, Layers, QrCode, Radio, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/nav";
import { BentoTile } from "@/components/bento-tile";
import { SearchHero } from "@/components/search-hero";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Nav />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <div className="mb-8 flex flex-col gap-3">
          <Badge variant="electric" className="w-fit">
            <Radio className="size-3" strokeWidth={2.25} />
            Locuri disponibile în timp real, la toți operatorii
          </Badge>
          <h1 className="max-w-xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Călătorii interurbane, rezervate în câteva secunde.
          </h1>
          <p className="max-w-lg text-md text-ink-secondary">
            Caută orice stație de pe traseu — nu doar capetele de linie — și
            plătești doar segmentul pe care îl parcurgi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(0,auto)]">
          <div className="lg:col-span-7 lg:row-span-2">
            <SearchHero />
          </div>

          <BentoTile className="lg:col-span-5" delay={0.05}>
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-electric-muted text-electric">
              <Layers className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-bold text-ink">Locul 12 poate fi vândut de două ori</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              O dată pentru Piatra Neamț → Roman, și încă o dată pentru
              Otopeni → București — aceeași cursă, același loc, segmente care
              nu se suprapun. Fără locuri blocate degeaba.
            </p>
          </BentoTile>

          <BentoTile className="lg:col-span-5" delay={0.1}>
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-emerald-muted text-emerald-hover">
              <ShieldCheck className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-bold text-ink">Doar operatori verificați</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Fiecare operator este verificat înainte ca rutele lui să fie
              publicate. Caută insigna de verificare la finalizarea comenzii.
            </p>
          </BentoTile>

          <BentoTile className="lg:col-span-4" delay={0.15}>
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-ink/[0.06] text-ink">
              <GitBranch className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-bold text-ink">Trasee cu N stații</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Rutele nu sunt doar A→B. Caută orice pereche de stații de pe o
              linie cu mai multe orașe și primești prețul exact pentru acel
              segment.
            </p>
          </BentoTile>

          <BentoTile className="lg:col-span-4" delay={0.2}>
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-ink/[0.06] text-ink">
              <QrCode className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-bold text-ink">Urcare fără semnal</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Fiecare cod QR de bilet este semnat criptografic. Șoferii îl
              verifică offline — nu e nevoie de conexiune la ușă.
            </p>
          </BentoTile>

          <BentoTile className="lg:col-span-4" delay={0.25}>
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-ink/[0.06] text-ink">
              <Radio className="size-4.5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 text-md font-bold text-ink">Hartă locuri în timp real</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Locurile se blochează instant când alt pasager le rezervă.
              Fereastră de 10 minute la finalizarea comenzii, fără
              suprarezervări.
            </p>
          </BentoTile>
        </div>
      </main>
    </div>
  );
}
