/**
 * Type-checks a parsed screener query, extracts its (at most one) sector
 * filter, and evaluates the remaining per-row predicate against a
 * `PeerMetrics` row.
 *
 * Values are compared in *display* units — the same units the results table
 * shows (₹ Cr, %, ratio) — via `toChartValue`, so `Market Cap > 1000` means
 * "> ₹1,000 Cr" and `ROE > 15` means "> 15%" with no unit inference needed.
 * Any comparison that touches a missing metric (or a division by zero)
 * evaluates to `false`, excluding that company rather than erroring.
 */

import { parse, type ScreenNode, type ScreenError } from "./parser";
import { toChartValue } from "../peer-columns";
import type { IndustrySector } from "../industry-sectors";
import type { PeerMetrics } from "../yfinance";

export interface ScreenPlan {
  /** Full parsed AST, including any sector filter. */
  ast: ScreenNode;
  /** AST with the top-level sector conjunct removed; null if the query was sector-only. */
  rowAst: ScreenNode | null;
  sector?: IndustrySector;
  /** Every metric key referenced anywhere in the query, in first-appearance order. */
  metricKeys: string[];
}

export type CompileResult = { ok: true; plan: ScreenPlan } | { ok: false; error: ScreenError };

type NodeType = "boolean" | "number";

function fail(message: string, node: { start: number; end: number }): never {
  throw { message, start: node.start, end: node.end } satisfies ScreenError;
}

/** Type-checks the tree and collects referenced metric keys. Throws a ScreenError on mismatch. */
function typeCheck(node: ScreenNode, metricKeys: Set<string>): NodeType {
  switch (node.kind) {
    case "number":
      return "number";
    case "metric":
      metricKeys.add(node.column.key as string);
      return "number";
    case "sectorEq":
      return "boolean";
    case "neg": {
      const t = typeCheck(node.operand, metricKeys);
      if (t !== "number") fail("Only numbers/metrics can be negated", node);
      return "number";
    }
    case "arith": {
      const l = typeCheck(node.left, metricKeys);
      const r = typeCheck(node.right, metricKeys);
      if (l !== "number" || r !== "number") {
        fail(`"${node.op}" needs numbers or metrics on both sides`, node);
      }
      return "number";
    }
    case "comparison": {
      const l = typeCheck(node.left, metricKeys);
      const r = typeCheck(node.right, metricKeys);
      if (l !== "number" || r !== "number") {
        fail(`"${node.op}" needs numbers or metrics on both sides`, node);
      }
      return "boolean";
    }
    case "logical": {
      const l = typeCheck(node.left, metricKeys);
      const r = typeCheck(node.right, metricKeys);
      if (l !== "boolean" || r !== "boolean") {
        fail(
          `"${node.op.toUpperCase()}" combines conditions, not values — did you mean to compare this to something? e.g. Market Cap > 1000`,
          node
        );
      }
      return "boolean";
    }
  }
}

/**
 * Extracts sector filters from the top-level AND chain (they select the
 * candidate universe, not a per-row predicate) and returns the remaining
 * row predicate. Rejects a sector filter found anywhere else (under OR, or
 * nested below arithmetic) since it isn't evaluable per-row there.
 */
function extractSector(node: ScreenNode): { rowAst: ScreenNode | null; sector?: IndustrySector } {
  // Flatten a left-associative top-level AND chain into its conjuncts.
  const conjuncts: ScreenNode[] = [];
  function flatten(n: ScreenNode) {
    if (n.kind === "logical" && n.op === "and") {
      flatten(n.left);
      flatten(n.right);
    } else {
      conjuncts.push(n);
    }
  }
  flatten(node);

  const sectorConjuncts = conjuncts.filter((c) => c.kind === "sectorEq") as Extract<ScreenNode, { kind: "sectorEq" }>[];
  const rest = conjuncts.filter((c) => c.kind !== "sectorEq");

  // Any sectorEq node left over inside `rest` (nested under OR/arithmetic) is disallowed.
  function assertNoNestedSector(n: ScreenNode) {
    if (n.kind === "sectorEq") {
      fail(`Sector filters must stand alone at the top level, e.g. "Sector = 'Technology' AND ROE > 15" — not combined with OR.`, n);
    }
    if (n.kind === "logical" || n.kind === "comparison" || n.kind === "arith") {
      assertNoNestedSector(n.left);
      assertNoNestedSector(n.right);
    } else if (n.kind === "neg") {
      assertNoNestedSector(n.operand);
    }
  }
  for (const r of rest) assertNoNestedSector(r);

  if (sectorConjuncts.length > 1) {
    fail("Only one Sector filter is supported per screen", sectorConjuncts[1]);
  }
  if (sectorConjuncts.length === 1 && sectorConjuncts[0].negated) {
    fail(`"Sector != ..." isn't supported — use Sector = '<name>' to pick one sector, or omit Sector to screen the whole market.`, sectorConjuncts[0]);
  }

  const rowAst = rest.reduce<ScreenNode | null>((acc, n) => {
    if (!acc) return n;
    return { kind: "logical", op: "and", left: acc, right: n, start: acc.start, end: n.end };
  }, null);

  return { rowAst, sector: sectorConjuncts[0]?.sector };
}

export function compileScreen(input: string): CompileResult {
  const parsed = parse(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    const metricKeySet = new Set<string>();
    const rootType = typeCheck(parsed.ast, metricKeySet);
    if (rootType !== "boolean") {
      fail("This isn't a complete condition yet — try comparing it to something, e.g. Market Cap > 1000", parsed.ast);
    }
    const { rowAst, sector } = extractSector(parsed.ast);
    return {
      ok: true,
      plan: { ast: parsed.ast, rowAst, sector, metricKeys: Array.from(metricKeySet) },
    };
  } catch (err) {
    if (err && typeof err === "object" && "message" in err && "start" in err && "end" in err) {
      return { ok: false, error: err as ScreenError };
    }
    throw err;
  }
}

function evalNumeric(node: ScreenNode, company: PeerMetrics): number | null {
  switch (node.kind) {
    case "number":
      return node.value;
    case "metric":
      return toChartValue(node.column, company[node.column.key] as number | null | undefined);
    case "neg": {
      const v = evalNumeric(node.operand, company);
      return v === null ? null : -v;
    }
    case "arith": {
      const l = evalNumeric(node.left, company);
      const r = evalNumeric(node.right, company);
      if (l === null || r === null) return null;
      switch (node.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          return r === 0 ? null : l / r;
      }
    }
    default:
      return null;
  }
}

/** Evaluates a compiled row predicate (`ScreenPlan.rowAst`) against one company. Null/rowAst=null means "match all". */
export function evaluateRow(node: ScreenNode | null, company: PeerMetrics): boolean {
  if (node === null) return true;
  switch (node.kind) {
    case "logical":
      return node.op === "and"
        ? evaluateRow(node.left, company) && evaluateRow(node.right, company)
        : evaluateRow(node.left, company) || evaluateRow(node.right, company);
    case "comparison": {
      const l = evalNumeric(node.left, company);
      const r = evalNumeric(node.right, company);
      if (l === null || r === null) return false;
      switch (node.op) {
        case ">":
          return l > r;
        case "<":
          return l < r;
        case ">=":
          return l >= r;
        case "<=":
          return l <= r;
        case "=":
          return l === r;
        case "!=":
          return l !== r;
      }
    }
    case "sectorEq":
      // Sector filters are pulled out of rowAst by `extractSector` before evaluation.
      return true;
    default:
      return false;
  }
}
