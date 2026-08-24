import Link from "next/link";
import { Bus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-dark glass-dark">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-ink-onDark">
          <span className="flex size-7 items-center justify-center rounded-md bg-electric text-white">
            <Bus className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-bold tracking-tight">BUSX</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-onDarkSecondary sm:flex">
          <Link href="/search" className="transition-colors hover:text-ink-onDark">
            Search
          </Link>
          <Link href="#operators" className="transition-colors hover:text-ink-onDark">
            For operators
          </Link>
          <Link href="#help" className="transition-colors hover:text-ink-onDark">
            Help
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost-dark" size="sm">
            Sign in
          </Button>
          <Button variant="electric" size="sm">
            My tickets
          </Button>
        </div>
      </div>
    </header>
  );
}
