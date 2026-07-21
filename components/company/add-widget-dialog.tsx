"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PEER_COLUMNS, PEER_COLUMN_GROUPS } from "@/lib/peer-columns";
import type { DashboardWidget } from "@/lib/dashboard-widgets";

/**
 * Adds a custom chart widget beyond the auto-generated one-per-selected-column
 * set — currently just scatter (metric vs. metric), the one new comparison
 * type this app didn't have before. Reuses the same grouped Command-list
 * pattern as PeerColumnEditor, just picking two metrics in sequence instead
 * of toggling membership in a set. Designed so a future chart type just
 * means another entry in the type step, not a rewrite.
 */
export function AddWidgetDialog({ onAdd }: { onAdd: (widget: DashboardWidget) => void }) {
  const [open, setOpen] = useState(false);
  const [xKey, setXKey] = useState<string | null>(null);

  function reset() {
    setXKey(null);
  }

  function handlePickX(key: string) {
    setXKey(key);
  }

  function handlePickY(key: string) {
    if (!xKey) return;
    onAdd({ id: `scatter:${xKey}:${key}:${crypto.randomUUID()}`, type: "scatter", xKey, yKey: key });
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <PlusIcon />
            Add chart
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{xKey ? "Pick the second metric" : "Add a scatter chart"}</DialogTitle>
          <DialogDescription>
            {xKey
              ? `Plotting against ${PEER_COLUMNS.find((c) => c.key === xKey)?.label}. Pick the metric for the vertical axis.`
              : "Plot two metrics against each other across every company — pick the metric for the horizontal axis first."}
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-lg! border">
          <CommandInput placeholder="Search metrics..." />
          <CommandList className="max-h-96">
            <CommandEmpty>No metric found.</CommandEmpty>
            {PEER_COLUMN_GROUPS.map((group) => {
              const columns = PEER_COLUMNS.filter((c) => c.group === group && c.key !== xKey);
              if (columns.length === 0) return null;
              return (
                <CommandGroup key={group} heading={group}>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.key}
                      value={column.label}
                      onSelect={() => (xKey ? handlePickY(column.key as string) : handlePickX(column.key as string))}
                    >
                      {column.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>

        {xKey && (
          <DialogFooter className="items-center sm:justify-start!">
            <Button variant="ghost" size="sm" onClick={reset}>
              Back
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
