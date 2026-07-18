"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlayIcon, SaveIcon, LinkIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QueryEditor } from "@/components/screener/query-editor";
import { ContextualHint } from "@/components/screener/contextual-hint";
import { ReferenceChips } from "@/components/screener/reference-chips";
import { ScreenResults } from "@/components/screener/screen-results";
import { AiChatPanel } from "@/components/screener/ai/ai-chat-panel";
import { useScreenerAgent } from "@/lib/hooks/use-screener-agent";
import {
  tokenize,
  compileScreen,
  loadScreens,
  upsertScreen,
  touchLastRun,
  type ScreenToken,
  type SavedScreen,
  type ScreenError,
} from "@/lib/screener";
import { SCREENER_BASE_COLUMN_KEYS, type PeerColumnDef } from "@/lib/peer-columns";

function parseColumnsParam(value: string | null): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map((s) => s.trim()).filter(Boolean)));
}

export function ScreenEditorView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q");
  const screenIdParam = searchParams.get("screen");
  const colsParam = searchParams.get("cols");
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(qParam ?? "");
  const [cursor, setCursor] = useState(draft.length);
  const [name, setName] = useState("");
  const [screenId, setScreenId] = useState<string | null>(null);
  const [customColumnKeys, setCustomColumnKeys] = useState<string[] | null>(
    colsParam ? parseColumnsParam(colsParam) : null
  );
  const [error, setError] = useState<ScreenError | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [lastAiQuery, setLastAiQuery] = useState<string | null>(null);
  const agent = useScreenerAgent();

  // Prefill from a saved screen (Run/Edit links from /screens) — only once, on mount.
  useEffect(() => {
    if (!screenIdParam) return;
    const saved = loadScreens().find((s) => s.id === screenIdParam);
    if (!saved) return;
    setScreenId(saved.id);
    setName(saved.name);
    if (!qParam) setDraft(saved.query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenIdParam]);

  const tokens = useMemo(() => tokenize(draft), [draft]);

  const executedMetricKeys = useMemo(() => {
    if (!qParam) return [];
    const compiled = compileScreen(qParam);
    return compiled.ok ? compiled.plan.metricKeys : [];
  }, [qParam]);
  const defaultColumnKeys = useMemo(
    () => Array.from(new Set([...SCREENER_BASE_COLUMN_KEYS, ...executedMetricKeys])),
    [executedMetricKeys]
  );
  const columnKeys = customColumnKeys ?? defaultColumnKeys;

  function updateUrl(next: { q?: string | null; cols?: string[] | null; screen?: string | null; page?: number | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.cols !== undefined) {
      if (next.cols && next.cols.length > 0) params.set("cols", next.cols.join(","));
      else params.delete("cols");
    }
    if (next.screen !== undefined) {
      if (next.screen) params.set("screen", next.screen);
      else params.delete("screen");
    }
    if (next.page !== undefined) {
      if (next.page && next.page > 1) params.set("page", String(next.page));
      else params.delete("page");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function runQuery(query: string) {
    const result = compileScreen(query);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setCustomColumnKeys(null);
    updateUrl({ q: query, page: null });
    if (screenId) touchLastRun(screenId);
  }

  function handleRun() {
    runQuery(draft);
  }

  function handleAiRun(query: string) {
    setDraft(query);
    setLastAiQuery(query);
    runQuery(query);
  }

  /** "0 matches, ask AI to loosen it" — a resume on the same parked proposal, not a new message. */
  function handleAiLoosen() {
    setShowAiPanel(true);
    agent.sendText("That query matched 0 companies — please loosen the thresholds and propose again.");
  }

  function handlePageChange(nextPage: number) {
    updateUrl({ page: nextPage });
  }

  function handleSave() {
    const result = compileScreen(draft);
    if (!result.ok) {
      setError(result.error);
      toast.error("Fix the query before saving");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Give this screen a name first");
      return;
    }
    const now = new Date().toISOString();
    const id = screenId ?? crypto.randomUUID();
    const existing = loadScreens().find((s) => s.id === id);
    const saved: SavedScreen = {
      id,
      name: trimmedName,
      query: draft,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      // If the draft was just run (qParam reflects it) and this is the
      // first save, credit that run rather than showing "Never run".
      lastRunAt: existing?.lastRunAt ?? (qParam === draft ? now : undefined),
    };
    upsertScreen(saved);
    setScreenId(id);
    updateUrl({ screen: id });
    toast.success(`Saved "${trimmedName}"`);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  function handleColumnChange(keys: string[]) {
    setCustomColumnKeys(keys);
    updateUrl({ cols: keys });
  }

  function replaceRange(start: number, end: number, text: string) {
    setDraft((prev) => prev.slice(0, start) + text + prev.slice(end));
    const pos = start + text.length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
      setCursor(pos);
    });
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    replaceRange(start, end, text);
  }

  function handlePickMetric(token: ScreenToken | null, column: PeerColumnDef) {
    if (token) {
      replaceRange(token.start, token.end, column.label);
    } else {
      insertAtCursor(column.label);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{screenId ? "Edit Screen" : "Create Screen"}</h1>
        <p className="text-sm text-muted-foreground">
          Write a condition using metric names, comparisons, and AND/OR — then run it against the market.
        </p>
      </div>

      {/*
        A plain native input, not the shared `Input` (base-ui Field.Control) —
        that component's internal controlled-value sync loops under rapid
        successive onChange dispatches on a bare text field (reproduced via
        fast programmatic typing; the pre-existing numeric `Input` usage in
        return-calculator.tsx doesn't hit it, likely because a native
        type="number" input coalesces rapid keystrokes differently).
      */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Screen name, e.g. Quality compounders"
        className="h-8 w-full max-w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 sm:max-w-xs"
      />

      <QueryEditor
        ref={textareaRef}
        value={draft}
        onChange={(v) => {
          setDraft(v);
          setError(null);
        }}
        onCursorChange={setCursor}
        hasError={!!error}
      />

      {error && <p className="text-xs text-destructive">{error.message}</p>}

      <ContextualHint tokens={tokens} cursor={cursor} onPickMetric={handlePickMetric} />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleRun}>
          <PlayIcon />
          Run
        </Button>
        <Button size="sm" variant="outline" onClick={handleSave}>
          <SaveIcon />
          Save
        </Button>
        {qParam && (
          <Button size="sm" variant="ghost" onClick={handleCopyLink}>
            <LinkIcon />
            Copy link
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setShowAiPanel((v) => !v)} aria-expanded={showAiPanel}>
          <SparklesIcon />
          Ask AI
          <ChevronDownIcon className={showAiPanel ? "rotate-180 transition-transform" : "transition-transform"} />
        </Button>
      </div>

      {showAiPanel && (
        <AiChatPanel
          items={agent.items}
          status={agent.status}
          busy={agent.busy}
          sendText={agent.sendText}
          pickOption={agent.pickOption}
          retry={agent.retry}
          reset={agent.reset}
          onRun={handleAiRun}
        />
      )}

      <div className="rounded-lg border bg-card p-4">
        <ReferenceChips onInsert={insertAtCursor} />
      </div>

      <ScreenResults
        query={qParam}
        page={page}
        onPageChange={handlePageChange}
        columnKeys={columnKeys}
        onColumnChange={handleColumnChange}
        defaultColumnKeys={defaultColumnKeys}
        aiAssist={qParam !== null && qParam === lastAiQuery && !agent.busy ? handleAiLoosen : null}
      />
    </div>
  );
}
