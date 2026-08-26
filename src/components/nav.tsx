import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BusxLogo } from "@/components/brand/busx-logo";

/**
 * The wordmark's story is the S→X ligature itself: the bottom curve of the
 * S flows in one unbroken stroke into the X's rising diagonal — the point
 * where routes cross, the same seat sold across crossing, non-overlapping
 * segments, is the one idea this whole product is built around.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-dark glass-dark">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center text-ink-onDark">
          <BusxLogo className="h-5 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-onDarkSecondary sm:flex">
          <Link href="/search" className="transition-colors hover:text-ink-onDark">
            Caută
          </Link>
          <Link href="#operators" className="transition-colors hover:text-ink-onDark">
            Pentru operatori
          </Link>
          <Link href="#help" className="transition-colors hover:text-ink-onDark">
            Ajutor
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost-dark" size="sm">
            Autentificare
          </Button>
          <Button variant="electric" size="sm">
            Biletele mele
          </Button>
        </div>
      </div>
    </header>
  );
}
