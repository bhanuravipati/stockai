import Link from "next/link";
import { ChevronDownIcon, GitCompareArrows, LayoutGrid, LineChart, ScanSearch, type LucideIcon } from "lucide-react";
import { HeaderSearch } from "@/components/search/header-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ToolEntry {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  badge?: string;
}

const TOOLS: ToolEntry[] = [
  {
    href: "/compare",
    icon: GitCompareArrows,
    title: "Compare Stocks",
    description: "Line up companies side by side",
    accent: "bg-chart-1/10 text-chart-1",
  },
  {
    href: "/industry",
    icon: LayoutGrid,
    title: "Industry",
    description: "Browse every company in a sector",
    accent: "bg-chart-5/10 text-chart-5",
  },
  {
    href: "/screens",
    icon: ScanSearch,
    title: "Screens",
    description: "Filter the market by your own conditions",
    accent: "bg-chart-2/10 text-chart-2",
    badge: "New",
  },
];

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
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "data-popup-open:[&>svg]:rotate-180 [&>svg]:transition-transform")}
          >
            Tools
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Explore
              </DropdownMenuLabel>
              {TOOLS.map((tool) => (
                <DropdownMenuItem
                  key={tool.href}
                  render={<Link href={tool.href} />}
                  className="items-start gap-3 rounded-lg p-2.5"
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tool.accent)}>
                    <tool.icon className="size-4.5" />
                  </span>
                  <span className="flex flex-col gap-0.5 py-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {tool.title}
                      {tool.badge && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold">
                          {tool.badge}
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{tool.description}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex flex-1 items-center justify-end gap-2">
          <HeaderSearch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
