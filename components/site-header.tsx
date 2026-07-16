import Link from "next/link";
import { LineChart } from "lucide-react";
import { HeaderSearch } from "@/components/search/header-search";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LineChart className="size-4.5" />
          </span>
          <span className="hidden sm:inline">Nebulion</span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-2">
          <HeaderSearch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
