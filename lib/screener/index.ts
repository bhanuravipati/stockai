export { tokenize, tokenAt } from "./tokenizer";
export type { ScreenToken, ScreenTokenType } from "./tokenizer";
export { parse } from "./parser";
export type { ScreenNode, ScreenError, ParseResult, CompareOp, ArithOp } from "./parser";
export { compileScreen, evaluateRow } from "./evaluator";
export type { ScreenPlan, CompileResult } from "./evaluator";
export { matchMetric, metricSuggestions, unitLabel, normalizeMetricName } from "./metrics";
export { loadScreens, upsertScreen, deleteScreen, touchLastRun } from "./storage";
export type { SavedScreen } from "./storage";

export interface OperatorHelpEntry {
  symbol: string;
  label: string;
  oneLiner: string;
  example: string;
}

/** One-line explanations shown in the contextual guide and the reference chips — no prose paragraphs. */
export const OPERATOR_HELP: OperatorHelpEntry[] = [
  { symbol: ">", label: "greater than", oneLiner: "left side must be more than the right", example: "ROE > 15" },
  { symbol: "<", label: "less than", oneLiner: "left side must be less than the right", example: "PE Ratio < 20" },
  { symbol: ">=", label: "at least", oneLiner: "greater than or equal to", example: "ROE >= 15" },
  { symbol: "<=", label: "at most", oneLiner: "less than or equal to", example: "Debt to Equity <= 1" },
  { symbol: "=", label: "equals", oneLiner: "left side must equal the right, exactly", example: "Sector = 'Technology'" },
  { symbol: "!=", label: "not equal to", oneLiner: "left side must differ from the right", example: "PEG Ratio != 0" },
  { symbol: "AND", label: "and", oneLiner: "both conditions must be true", example: "ROE > 15 AND PE Ratio < 20" },
  { symbol: "OR", label: "or", oneLiner: "at least one condition must be true", example: "ROE > 20 OR Dividend Yield > 3" },
  { symbol: "+", label: "plus", oneLiner: "adds two metrics or numbers", example: "Total Debt + Total Cash" },
  { symbol: "-", label: "minus", oneLiner: "subtracts the right side from the left", example: "Revenue - Net Income" },
  { symbol: "*", label: "times", oneLiner: "multiplies two metrics or numbers", example: "Market Cap * 0.1" },
  { symbol: "/", label: "divided by", oneLiner: "divides the left side by the right", example: "Total Debt / EBITDA < 3" },
  { symbol: "(", label: "open group", oneLiner: "groups conditions so AND/OR apply in the order you want", example: "(ROE > 15 OR ROA > 10) AND PE Ratio < 25" },
  { symbol: ")", label: "close group", oneLiner: "closes a group opened with (", example: "(ROE > 15 OR ROA > 10) AND PE Ratio < 25" },
  { symbol: "Sector =", label: "sector filter", oneLiner: "limits the screen to one sector — must stand alone, joined with AND", example: "Sector = 'Technology' AND ROE > 15" },
];

export function findOperatorHelp(symbol: string): OperatorHelpEntry | undefined {
  return OPERATOR_HELP.find((e) => e.symbol.toLowerCase() === symbol.toLowerCase());
}
