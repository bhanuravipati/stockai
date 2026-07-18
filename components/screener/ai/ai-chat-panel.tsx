"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentStatus, ChatItem, QuickOption } from "@/lib/hooks/use-screener-agent";
import { ChatMessageList } from "./chat-message-list";

/**
 * Chat panel that turns a vague request into a screener query via the
 * screener agent (see plan.md). Mounted as a collapsible "Ask AI" section in
 * the screen editor — `onRun` wires a proposal's Run button into the same
 * path as the editor's own Run button (setDraft + updateUrl).
 *
 * Takes the `useScreenerAgent()` state as props rather than calling the hook
 * itself — the editor lifts it so the zero-results empty state can also
 * trigger a "loosen the filters" resume on the same conversation.
 */
export function AiChatPanel({
  items,
  status,
  busy,
  sendText,
  pickOption,
  retry,
  reset,
  onRun,
}: {
  items: ChatItem[];
  status: AgentStatus | null;
  busy: boolean;
  sendText: (text: string) => void;
  pickOption: (clarificationId: string, option: QuickOption) => void;
  retry: () => void;
  reset: () => void;
  onRun: (query: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items, status]);

  function handleSend() {
    if (!draft.trim() || busy) return;
    sendText(draft);
    setDraft("");
  }

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Ask AI</p>
          {items.length > 0 && (
            <Button size="xs" variant="ghost" onClick={reset}>
              <PlusIcon />
              New chat
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto pr-1">
          <ChatMessageList items={items} status={status} busy={busy} onPickOption={pickOption} onRun={onRun} onRefine={sendText} onRetry={retry} />
          <div ref={listEndRef} />
        </div>

        <div className="flex items-center gap-2">
          {/* Plain native input, not the shared `Input` — see web/CLAUDE.md's
              note on its infinite re-render loop under rapid onChange. */}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={busy}
            placeholder="e.g. undervalued stocks in the technology sector"
            className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          />
          <Button size="sm" onClick={handleSend} disabled={busy || !draft.trim()}>
            <SendIcon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
