"use client";

import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentStatus, ChatItem, QuickOption } from "@/lib/hooks/use-screener-agent";
import { QuickPickOptions } from "./quick-pick-options";
import { ProposalCard } from "./proposal-card";

const STATUS_LABEL: Record<AgentStatus, string> = {
  thinking: "Thinking…",
  composing: "Writing a query…",
  validating: "Checking it compiles…",
};

export function ChatMessageList({
  items,
  status,
  busy,
  onPickOption,
  onRun,
  onRefine,
  onRetry,
}: {
  items: ChatItem[];
  status: AgentStatus | null;
  busy: boolean;
  onPickOption: (clarificationId: string, option: QuickOption) => void;
  onRun: (query: string) => void;
  onRefine: (feedback: string) => void;
  onRetry: () => void;
}) {
  if (items.length === 0 && !status) {
    return (
      <p className="text-sm text-muted-foreground">
        Describe what you&apos;re looking for — e.g. &quot;undervalued stocks in the technology sector&quot; — and I&apos;ll
        ask a couple of quick questions, then write a screen for you.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        switch (item.kind) {
          case "user":
            return (
              <div key={item.id} className="ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                {item.text}
              </div>
            );
          case "assistant":
            return (
              <p key={item.id} className="max-w-[90%] text-sm">
                {item.text}
              </p>
            );
          case "clarification":
            return (
              <div key={item.id} className="space-y-2">
                <p className="text-sm font-medium">{item.question}</p>
                <QuickPickOptions options={item.options} disabled={item.answered || busy} onPick={(option) => onPickOption(item.id, option)} />
                {item.allowFreeText && !item.answered && (
                  <p className="text-xs text-muted-foreground">Or type your own answer below.</p>
                )}
              </div>
            );
          case "proposal":
            return (
              <ProposalCard
                key={item.id}
                title={item.title}
                query={item.query}
                explanation={item.explanation}
                valid={item.valid}
                superseded={item.superseded}
                busy={busy}
                onRun={onRun}
                onRefine={onRefine}
              />
            );
          case "error":
            return (
              <div key={item.id} className="flex items-center gap-2 text-xs text-destructive">
                <AlertTriangleIcon className="size-3.5 shrink-0" />
                <span className="flex-1">{item.message}</span>
                {item.code === "rate_limited" && (
                  <Button size="xs" variant="outline" onClick={onRetry} disabled={busy}>
                    <RotateCcwIcon />
                    Retry
                  </Button>
                )}
              </div>
            );
          default:
            return null;
        }
      })}
      {status && <p className="text-xs text-muted-foreground">{STATUS_LABEL[status]}</p>}
    </div>
  );
}
