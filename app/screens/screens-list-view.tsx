"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, PlayIcon, PencilIcon, Trash2Icon, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/format";
import { loadScreens, deleteScreen, type SavedScreen } from "@/lib/screener";

export function ScreensListView() {
  const [screens, setScreens] = useState<SavedScreen[] | null>(null);

  useEffect(() => {
    setScreens(loadScreens());
  }, []);

  function handleDelete(screen: SavedScreen) {
    deleteScreen(screen.id);
    setScreens((prev) => (prev ?? []).filter((s) => s.id !== screen.id));
    toast.success(`Deleted "${screen.name}"`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Screens</h1>
          <p className="text-sm text-muted-foreground">
            Filter stocks by conditions on price, valuation, and fundamentals — saved in this browser.
          </p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href="/screens/new" />}>
          <PlusIcon />
          Create Screen
        </Button>
      </div>

      {screens === null && null}

      {screens !== null && screens.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-12 text-center">
          <ScanSearch className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You haven&apos;t created any screens yet. A screen is a saved condition, like
            <br />
            <code className="text-xs">Market Cap &gt; 1000 AND ROE &gt; 15</code>
          </p>
          <Button size="sm" className="mt-2" nativeButton={false} render={<Link href="/screens/new" />}>
            <PlusIcon />
            Create Screen
          </Button>
        </div>
      )}

      {screens !== null && screens.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {screens
            .slice()
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((screen) => (
              <Card key={screen.id}>
                <CardHeader>
                  <CardTitle>{screen.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <code className="block truncate text-xs text-muted-foreground">{screen.query}</code>
                  <p className="text-xs text-muted-foreground">
                    {screen.lastRunAt ? `Last run ${formatRelativeDate(screen.lastRunAt)}` : "Never run"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/screens/new?screen=${screen.id}&q=${encodeURIComponent(screen.query)}`} />}
                    >
                      <PlayIcon />
                      Run
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/screens/new?screen=${screen.id}`} />}
                    >
                      <PencilIcon />
                      Edit
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(screen)} aria-label={`Delete ${screen.name}`}>
                      <Trash2Icon />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
