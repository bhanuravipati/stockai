"use client";

import { useRouter } from "next/navigation";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { INDUSTRY_SECTORS } from "@/lib/industry-sectors";

export function IndustrySearch() {
  const router = useRouter();

  return (
    <Command className="rounded-xl border">
      <CommandInput placeholder="Search a sector (e.g. Technology, Energy, Financial Services)..." />
      <CommandList>
        <CommandEmpty>No sector found.</CommandEmpty>
        <CommandGroup>
          {INDUSTRY_SECTORS.map((s) => (
            <CommandItem key={s.key} value={s.label} onSelect={() => router.push(`/industry/${s.key}`)}>
              {s.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
