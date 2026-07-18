"use client";

import { Button } from "@/components/ui/button";
import type { QuickOption } from "@/lib/hooks/use-screener-agent";

export function QuickPickOptions({
  options,
  disabled,
  onPick,
}: {
  options: QuickOption[];
  disabled: boolean;
  onPick: (option: QuickOption) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Button key={option.value} size="sm" variant="outline" disabled={disabled} onClick={() => onPick(option)}>
          {option.label}
        </Button>
      ))}
    </div>
  );
}
