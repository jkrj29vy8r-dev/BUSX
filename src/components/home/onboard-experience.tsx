import { Armchair, Luggage, Radar, Wifi } from "lucide-react";
import { BusIllustrationFlat } from "@/components/home/bus-illustration-flat";

const FEATURES = [
  { icon: Wifi, label: "Wi-Fi gratuit & încărcare USB", description: "Conectat tot drumul, la fiecare loc." },
  { icon: Armchair, label: "Locuri confortabile, reclinabile", description: "Spațiu real pentru picioare, pe orice distanță." },
  { icon: Radar, label: "Urmărire GPS în timp real", description: "Știi mereu exact unde e autocarul tău." },
  { icon: Luggage, label: "Bagaj suplimentar inclus", description: "Un bagaj de cală, fără costuri ascunse." },
];

/** "Experiența BUSX la bord" — the one place the brand gets an actual
 * vehicle illustration, paired with the four amenities that are true of
 * every BUSX-operated route, not marketing filler. */
export function OnboardExperience() {
  return (
    <section className="bg-[#F0F4FF] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Experiența BUSX la bord</h2>
          <p className="mt-2 text-md text-ink-secondary">Aceeași flotă, verificată, la fiecare cursă publicată.</p>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <BusIllustrationFlat className="w-full drop-shadow-md" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, label, description }) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-subtle">
                <div className="flex size-10 items-center justify-center rounded-md bg-electric-muted text-electric">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-ink">{label}</h3>
                <p className="mt-1 text-xs text-ink-secondary">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
