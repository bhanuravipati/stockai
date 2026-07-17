/**
 * Turns a screener query string into positioned tokens. Never throws —
 * unresolved words come back as `unknown` tokens so the query editor can
 * offer autocomplete on a query that isn't valid (yet), and the parser is
 * the one that turns bad token sequences into errors.
 */

import { matchMetric } from "./metrics";
import type { PeerColumnDef } from "../peer-columns";

export type ScreenTokenType =
  | "metric"
  | "number"
  | "string"
  | "compare"
  | "arith"
  | "and"
  | "or"
  | "sector"
  | "lparen"
  | "rparen"
  | "unknown";

export interface ScreenToken {
  type: ScreenTokenType;
  text: string;
  start: number;
  end: number;
  value?: number;
  column?: PeerColumnDef;
}

interface RawToken {
  type: "word" | "number" | "string" | "compare" | "arith" | "and" | "or" | "sector" | "lparen" | "rparen";
  text: string;
  start: number;
  end: number;
  value?: number;
}

const COMPARE_OPS = [">=", "<=", "!=", ">", "<", "="];
const ARITH_OPS = ["+", "-", "*", "/"];

function scanRaw(input: string): RawToken[] {
  const tokens: RawToken[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "(" || ch === ")") {
      tokens.push({ type: ch === "(" ? "lparen" : "rparen", text: ch, start: i, end: i + 1 });
      i++;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = ch;
      let j = i + 1;
      while (j < n && input[j] !== quote) j++;
      const text = input.slice(i + 1, j);
      tokens.push({ type: "string", text, start: i, end: Math.min(j + 1, n) });
      i = j + 1;
      continue;
    }

    const compareMatch = COMPARE_OPS.find((op) => input.startsWith(op, i));
    if (compareMatch) {
      tokens.push({ type: "compare", text: compareMatch, start: i, end: i + compareMatch.length });
      i += compareMatch.length;
      continue;
    }

    if (ARITH_OPS.includes(ch)) {
      tokens.push({ type: "arith", text: ch, start: i, end: i + 1 });
      i++;
      continue;
    }

    // Pure number, not immediately followed by a letter (so "52W" isn't cut into "52" + "W").
    const numberMatch = /^\d+(\.\d+)?/.exec(input.slice(i));
    if (numberMatch && !/[A-Za-z]/.test(input[i + numberMatch[0].length] ?? "")) {
      const text = numberMatch[0];
      tokens.push({ type: "number", text, start: i, end: i + text.length, value: Number(text) });
      i += text.length;
      continue;
    }

    // Word — letters/digits, may start with either (covers labels like "52W High").
    const wordMatch = /^[A-Za-z0-9]+/.exec(input.slice(i));
    if (wordMatch) {
      const text = wordMatch[0];
      const lower = text.toLowerCase();
      const type = lower === "and" ? "and" : lower === "or" ? "or" : lower === "sector" ? "sector" : "word";
      tokens.push({ type, text, start: i, end: i + text.length });
      i += text.length;
      continue;
    }

    // Unrecognized character (punctuation, etc.) — surface as its own single-char unknown word.
    tokens.push({ type: "word", text: ch, start: i, end: i + 1 });
    i++;
  }

  return tokens;
}

const MAX_PHRASE_WINDOW = 6;

/** Whether a raw token can appear mid-phrase in a multi-word metric label ("Debt / Equity", "Sales Var (QoQ)"). */
function isPhraseMember(t: RawToken): boolean {
  return t.type === "word" || t.type === "lparen" || t.type === "rparen" || (t.type === "arith" && t.text === "/");
}

export function tokenize(input: string): ScreenToken[] {
  const raw = scanRaw(input);
  const out: ScreenToken[] = [];
  let i = 0;

  while (i < raw.length) {
    const t = raw[i];

    if (t.type === "word") {
      let matched: { len: number; column: PeerColumnDef } | undefined;
      const maxLen = Math.min(MAX_PHRASE_WINDOW, raw.length - i);
      for (let len = maxLen; len >= 1; len--) {
        const last = raw[i + len - 1];
        // A metric label never ends on a bare "/" or "(" — skip windows that
        // would end there (normalizing strips the trailing punctuation,
        // which would otherwise make e.g. "Total Debt /" falsely match
        // "Total Debt" and swallow the division operator with it).
        if (len > 1 && last.type !== "word" && last.type !== "rparen") continue;
        let ok = true;
        for (let k = 1; k < len; k++) {
          if (!isPhraseMember(raw[i + k])) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        const phrase = input.slice(t.start, last.end);
        const column = matchMetric(phrase);
        if (column) {
          matched = { len, column };
          break;
        }
      }

      if (matched) {
        const last = raw[i + matched.len - 1];
        out.push({ type: "metric", text: input.slice(t.start, last.end), start: t.start, end: last.end, column: matched.column });
        i += matched.len;
      } else {
        out.push({ type: "unknown", text: t.text, start: t.start, end: t.end });
        i += 1;
      }
      continue;
    }

    if (t.type === "number") {
      out.push({ type: "number", text: t.text, start: t.start, end: t.end, value: t.value });
    } else if (t.type === "string") {
      out.push({ type: "string", text: t.text, start: t.start, end: t.end });
    } else {
      out.push({ type: t.type, text: t.text, start: t.start, end: t.end });
    }
    i += 1;
  }

  return out;
}

/** The token whose span contains `cursor`, preferring the token immediately to the cursor's left at a boundary. */
export function tokenAt(tokens: ScreenToken[], cursor: number): ScreenToken | undefined {
  for (const t of tokens) {
    if (cursor > t.start && cursor <= t.end) return t;
  }
  for (const t of tokens) {
    if (cursor >= t.start && cursor <= t.end) return t;
  }
  return undefined;
}
