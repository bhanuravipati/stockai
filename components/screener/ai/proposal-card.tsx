"use client";

import { useState } from "react";
import { PlayIcon, RefreshCcwIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function ProposalCard({
  title,
  query,
  explanation,
  valid,
  superseded,
  busy,
  onRun,
  onRefine,
}: {
  title: string;
  query: string;
  explanation: string;
  valid: boolean | null;
  superseded: boolean;
  busy: boolean;
  onRun: (query: string) => void;
  onRefine: (feedback: string) => void;
}) {
  const [refining, setRefining] = useState(false);
  const [feedback, setFeedback] = useState("");

  function submitRefine() {
    const trimmed = feedback.trim();
    if (!trimmed) return;
    onRefine(trimmed);
    setFeedback("");
    setRefining(false);
  }

  return (
    <Card size="sm" className={superseded ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {title || "Proposed screen"}
          {valid === false && <Badge variant="destructive">Might not compile</Badge>}
          {valid === null && <Badge variant="secondary">Unverified</Badge>}
        </CardTitle>
        {explanation && <CardDescription>{explanation}</CardDescription>}
      </CardHeader>
      <CardContent>
        <code className="block rounded-md bg-muted px-2.5 py-1.5 text-xs break-words">{query}</code>
      </CardContent>
      {!superseded && (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t-0 bg-transparent px-(--card-spacing) pb-(--card-spacing) pt-0">
          <Button size="sm" onClick={() => onRun(query)} disabled={busy}>
            <PlayIcon />
            Run
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRefining((v) => !v)} disabled={busy}>
            <RefreshCcwIcon />
            Refine
          </Button>
        </CardFooter>
      )}
      {refining && (
        <CardFooter className="flex items-center gap-2 border-t-0 bg-transparent px-(--card-spacing) pb-(--card-spacing) pt-0">
          <input
            autoFocus
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRefine();
            }}
            placeholder="e.g. stricter thresholds, add a dividend filter..."
            className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <Button size="sm" onClick={submitRefine} disabled={busy || !feedback.trim()}>
            Send
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
