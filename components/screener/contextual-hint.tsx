"use client";

import { Badge } from "@/components/ui/badge";
import { tokenAt, metricSuggestions, unitLabel, findOperatorHelp, type ScreenToken } from "@/lib/screener";
import type { PeerColumnDef } from "@/lib/peer-columns";

/**
 * The screener's "guide" — a single, cursor-aware hint message rather than a
 * block of prose. Switches based on the token the cursor is touching: an
 * unresolved word gets metric autocomplete, an operator gets a one-liner +
 * example, a resolved metric gets its unit.
 */
export function ContextualHint({
  tokens,
  cursor,
  onPickMetric,
}: {
  tokens: ScreenToken[];
  cursor: number;
  onPickMetric: (token: ScreenToken | null, column: PeerColumnDef) => void;
}) {
  const token = tokenAt(tokens, cursor);

  if (!token) {
    return (
      <p className="text-xs text-muted-foreground">
        Type a metric name to get suggestions — e.g. <code className="text-foreground">Market Cap</code> or{" "}
        <code className="text-foreground">ROE</code>.
      </p>
    );
  }

  if (token.type === "unknown") {
    const suggestions = metricSuggestions(token.text);
    if (suggestions.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          No metric matches &quot;{token.text}&quot; — see the reference below for the full list.
        </p>
      );
    }
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Did you mean:</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((col) => (
            <button
              key={col.key as string}
              type="button"
              onClick={() => onPickMetric(token, col)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs hover:bg-muted"
            >
              {col.label}
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {unitLabel(col)}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (token.type === "metric" && token.column) {
    const col = token.column;
    return (
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{col.label}</span> · {col.group} · values in{" "}
        <span className="font-medium text-foreground">{unitLabel(col)}</span> — e.g.{" "}
        <code className="text-foreground">
          {col.label} &gt; {col.format === "percent" ? 10 : col.format === "cr" ? 1000 : 1}
        </code>
      </p>
    );
  }

  if (token.type === "sector") {
    const help = findOperatorHelp("Sector =");
    return (
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Sector</span> — {help?.oneLiner}. e.g.{" "}
        <code className="text-foreground">{help?.example}</code>
      </p>
    );
  }

  if (token.type === "compare" || token.type === "arith" || token.type === "and" || token.type === "or") {
    const help = findOperatorHelp(token.text);
    if (help) {
      return (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{help.symbol}</span> — {help.oneLiner}. e.g.{" "}
          <code className="text-foreground">{help.example}</code>
        </p>
      );
    }
  }

  if (token.type === "lparen" || token.type === "rparen") {
    const help = findOperatorHelp(token.text);
    return (
      <p className="text-xs text-muted-foreground">
        {help?.oneLiner}. e.g. <code className="text-foreground">{help?.example}</code>
      </p>
    );
  }

  if (token.type === "number") {
    return <p className="text-xs text-muted-foreground">A number — compare it to a metric on the other side.</p>;
  }

  if (token.type === "string") {
    return <p className="text-xs text-muted-foreground">A sector name, in quotes.</p>;
  }

  return null;
}
