import Link from "next/link";
import { Bus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <span className="flex size-7 items-center justify-center rounded-md bg-accent text-white">
            <Bus className="size-4" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold tracking-tight">BUSX</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-secondary sm:flex">
          <Link href="/search" className="transition-colors hover:text-ink">
            Search
          </Link>
          <Link href="#operators" className="transition-colors hover:text-ink">
            For operators
          </Link>
          <Link href="#help" className="transition-colors hover:text-ink">
            Help
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
          <Button variant="secondary" size="sm">
            My tickets
          </Button>
        </div>
      </div>
    </header>
  );
}
