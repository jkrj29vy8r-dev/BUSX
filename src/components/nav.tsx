import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * The wordmark is deliberately just type, no icon glyph — "BUS" plus an X
 * marked in emerald. The X is the story: it's the point where routes
 * cross — the same seat, sold across crossing, non-overlapping segments,
 * is the one idea this whole product is built around.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-dark glass-dark">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center text-ink-onDark">
          <span className="text-lg font-extrabold tracking-tight">
            BUS<span className="text-emerald">X</span>
          </span>
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
