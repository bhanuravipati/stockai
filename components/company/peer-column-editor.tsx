"use client";

import { SlidersHorizontalIcon } from "lucide-react";
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
import { DEFAULT_PEER_COLUMN_KEYS, PEER_COLUMNS, PEER_COLUMN_GROUPS } from "@/lib/peer-columns";

export function PeerColumnEditor({
  selectedKeys,
  onChange,
  resetKeys = DEFAULT_PEER_COLUMN_KEYS,
}: {
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  /** Keys "Reset to default" restores — defaults to the Peers tab's own default set. */
  resetKeys?: string[];
}) {
  const selectedSet = new Set(selectedKeys);

  function toggle(key: string) {
    const next = new Set(selectedSet);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(Array.from(next));
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <SlidersHorizontalIcon />
            Edit columns
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit comparison columns</DialogTitle>
          <DialogDescription>
            Choose which metrics to compare across peers. {selectedKeys.length} selected.
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-lg! border">
          <CommandInput placeholder="Search metrics..." />
          <CommandList className="max-h-96">
            <CommandEmpty>No metric found.</CommandEmpty>
            {PEER_COLUMN_GROUPS.map((group) => {
              const columns = PEER_COLUMNS.filter((c) => c.group === group);
              return (
                <CommandGroup key={group} heading={group}>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.key}
                      value={column.label}
                      data-checked={selectedSet.has(column.key as string)}
                      onSelect={() => toggle(column.key as string)}
                    >
                      {column.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>

        <DialogFooter className="items-center sm:justify-between!">
          <Button variant="ghost" size="sm" onClick={() => onChange(resetKeys)}>
            Reset to default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
