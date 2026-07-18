"use client";

import { useCallback, useRef, useState } from "react";

export interface QuickOption {
  label: string;
  value: string;
}

export type ChatItem =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "clarification"; question: string; options: QuickOption[]; allowFreeText: boolean; answered: boolean }
  | { id: string; kind: "proposal"; query: string; title: string; explanation: string; valid: boolean | null; superseded: boolean }
  | { id: string; kind: "error"; code: string; message: string };

export type AgentStatus = "thinking" | "composing" | "validating";

type ResumeKind = "option" | "text" | "feedback";

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/** Splits a raw SSE byte stream into `{event, data}` pairs as they arrive. */
async function* readSseEvents(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<{ event: string; data: unknown }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        let event = "message";
        const dataLines: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) event = line.slice("event:".length).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).trim());
        }
        if (dataLines.length === 0) continue;
        try {
          yield { event, data: JSON.parse(dataLines.join("")) };
        } catch {
          // Malformed chunk — skip it, keep the stream alive.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Drives the screener agent's SSE chat protocol (see plan.md). The agent's
 * thread always ends a turn parked at an interrupt (a clarifying question or
 * a proposal awaiting feedback) — so after the very first message, every
 * further user input is a *resume*, not a new message. `sendText` figures
 * out the right resume kind from the last chat item so callers can just
 * treat the whole conversation as "type a thing, hit send".
 */
export function useScreenerAgent() {
  const [threadId, setThreadId] = useState(() => newId());
  const [items, setItems] = useState<ChatItem[]>([]);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ thread_id: string; message: string } | { thread_id: string; resume: { kind: ResumeKind; value: string } } | null>(null);

  const runStream = useCallback(
    async (body: { thread_id: string; message: string } | { thread_id: string; resume: { kind: ResumeKind; value: string } }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastRequestRef.current = body;

      setBusy(true);
      setStatus("thinking");
      try {
        const res = await fetch("/api/screener-agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          setItems((prev) => [...prev, { id: newId(), kind: "error", code: "internal", message: `Request failed (${res.status})` }]);
          return;
        }

        for await (const { event, data } of readSseEvents(res.body, controller.signal)) {
          const d = data as Record<string, unknown>;
          switch (event) {
            case "status":
              setStatus(d.state as AgentStatus);
              break;
            case "assistant_message":
              setItems((prev) => [...prev, { id: newId(), kind: "assistant", text: String(d.text ?? "") }]);
              break;
            case "clarification":
              setItems((prev) => [
                ...prev,
                {
                  id: newId(),
                  kind: "clarification",
                  question: String(d.question ?? ""),
                  options: (d.options as QuickOption[]) ?? [],
                  allowFreeText: d.allow_free_text !== false,
                  answered: false,
                },
              ]);
              break;
            case "proposal":
              setItems((prev) => [
                ...prev.map((it) => (it.kind === "proposal" ? { ...it, superseded: true } : it)),
                {
                  id: newId(),
                  kind: "proposal",
                  query: String(d.query ?? ""),
                  title: String(d.title ?? ""),
                  explanation: String(d.explanation ?? ""),
                  valid: (d.valid as boolean | null) ?? null,
                  superseded: false,
                },
              ]);
              break;
            case "error":
              setItems((prev) => [...prev, { id: newId(), kind: "error", code: String(d.code ?? "internal"), message: String(d.message ?? "Something went wrong.") }]);
              break;
            case "done":
              break;
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setItems((prev) => [...prev, { id: newId(), kind: "error", code: "internal", message: "Connection lost — please try again." }]);
        }
      } finally {
        setBusy(false);
        setStatus(null);
      }
    },
    []
  );

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const last = items[items.length - 1];
      setItems((prev) => [...prev, { id: newId(), kind: "user", text: trimmed }]);

      if (last?.kind === "clarification" && !last.answered) {
        setItems((prev) => prev.map((it) => (it.id === last.id ? { ...it, answered: true } : it)));
        void runStream({ thread_id: threadId, resume: { kind: "text", value: trimmed } });
      } else if (last?.kind === "proposal") {
        void runStream({ thread_id: threadId, resume: { kind: "feedback", value: trimmed } });
      } else {
        void runStream({ thread_id: threadId, message: trimmed });
      }
    },
    [busy, items, runStream, threadId]
  );

  const pickOption = useCallback(
    (clarificationId: string, option: QuickOption) => {
      if (busy) return;
      setItems((prev) => [
        ...prev.map((it) => (it.id === clarificationId ? { ...it, answered: true } : it)),
        { id: newId(), kind: "user", text: option.label },
      ]);
      void runStream({ thread_id: threadId, resume: { kind: "option", value: option.value } });
    },
    [busy, runStream, threadId]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setThreadId(newId());
    setItems([]);
    setStatus(null);
    setBusy(false);
    lastRequestRef.current = null;
  }, []);

  /**
   * Re-sends the request that just failed (e.g. after a `rate_limited`
   * error) — safe because the graph only commits a checkpoint once a node
   * finishes; a mid-node failure leaves the thread parked exactly where it
   * was, so resuming/re-sending picks up from there rather than skipping or
   * duplicating a turn.
   */
  const retry = useCallback(() => {
    if (!busy && lastRequestRef.current) void runStream(lastRequestRef.current);
  }, [busy, runStream]);

  return { threadId, items, status, busy, sendText, pickOption, retry, reset };
}
