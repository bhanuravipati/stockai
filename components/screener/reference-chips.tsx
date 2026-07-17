"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { PEER_COLUMNS, PEER_COLUMN_GROUPS } from "@/lib/peer-columns";
import { OPERATOR_HELP, unitLabel } from "@/lib/screener";

/** Always-visible operator/metric reference — click any chip to insert it at the cursor. */
export function ReferenceChips({ onInsert }: { onInsert: (text: string) => void }) {
  const [group, setGroup] = useState(PEER_COLUMN_GROUPS[0]);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Operators</p>
        <TooltipProvider>
          <div className="flex flex-wrap gap-1.5">
            {OPERATOR_HELP.map((op) => (
              <Tooltip key={op.symbol}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => onInsert(op.symbol === "Sector =" ? "Sector = 'Technology'" : ` ${op.symbol} `)}
                      className="rounded-md border border-border px-2 py-1 font-mono text-xs hover:bg-muted"
                    />
                  }
                >
                  {op.symbol}
                </TooltipTrigger>
                <TooltipContent>
                  {op.oneLiner} — {op.example}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Metrics</p>
        <Tabs value={group} onValueChange={(v) => setGroup(v as typeof group)}>
          <TabsList variant="line" className="h-auto flex-wrap justify-start">
            {PEER_COLUMN_GROUPS.map((g) => (
              <TabsTrigger key={g} value={g} className="text-xs">
                {g}
              </TabsTrigger>
            ))}
          </TabsList>
          {PEER_COLUMN_GROUPS.map((g) => (
            <TabsContent key={g} value={g}>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {PEER_COLUMNS.filter((c) => c.group === g).map((col) => (
                  <button
                    key={col.key as string}
                    type="button"
                    onClick={() => onInsert(col.label)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs hover:bg-muted"
                  >
                    {col.label}
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {unitLabel(col)}
                    </Badge>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
