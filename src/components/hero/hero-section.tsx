import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SearchHero } from "@/components/search-hero";
import { TrustStrip } from "@/components/hero/trust-strip";

/**
 * The homepage hero: a plain, light canvas with the search dock as the one
 * visual centerpiece — no illustration, no animated backdrop. Matches the
 * FlixBus/Omio/Stripe reference set the brand deliberately follows here:
 * the product (fast, real search) is the thing that has to look expensive,
 * not decoration around it.
 */
export function HeroSection() {
  return (
    <div className="bg-[#F8FAFC] pb-16 pt-14 sm:pb-20 sm:pt-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Badge variant="electric" className="mx-auto w-fit">
          <Radio className="size-3" strokeWidth={2.25} />
          Locuri disponibile în timp real, la toți operatorii
        </Badge>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl">
          Călătorii interurbane cu autocarul. Simplu, rapid și digital.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-md text-ink-secondary">
          Găsește orarul curselor de autocar și microbuz, compară prețurile și
          rezervă biletul digital fără taxe ascunse.
        </p>
      </div>

      <div className="mx-auto mt-9 max-w-5xl px-6">
        <SearchHero />
        <TrustStrip className="mt-7" />
      </div>
    </div>
  );
}
