/**
 * Exports the screener's metric/sector vocabulary to a static JSON file
 * consumed by ai-service's screener agent prompt builder
 * (`ai-service/app/ai/screener_prompts.py`). Generated + committed — rerun
 * manually (`npm run export:vocab`) whenever PEER_COLUMNS/ALIASES/
 * INDUSTRY_SECTORS change. No runtime coupling between the two services.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PEER_COLUMNS } from "../lib/peer-columns";
import { ALIASES, normalizeMetricName } from "../lib/screener/metrics";
import { INDUSTRY_SECTORS } from "../lib/industry-sectors";
import { OPERATOR_HELP } from "../lib/screener";

const MAX_QUERY_LENGTH = 500;

const aliasesByKey = new Map<string, string[]>();
for (const [alias, key] of Object.entries(ALIASES)) {
  const list = aliasesByKey.get(key as string) ?? [];
  list.push(alias);
  aliasesByKey.set(key as string, list);
}

const metrics = PEER_COLUMNS.map((column) => ({
  key: column.key as string,
  label: column.label,
  group: column.group,
  format: column.format,
  rawFraction: column.rawFraction ?? false,
  aliases: aliasesByKey.get(column.key as string) ?? [],
}));

// Sanity check: every metric must resolve back through normalizeMetricName
// via its own label — if this ever fails, metrics.ts's lookup building
// changed shape and this export needs to change with it.
for (const column of PEER_COLUMNS) {
  if (!normalizeMetricName(column.label)) {
    throw new Error(`Metric "${column.key}" has an unnormalizable label`);
  }
}

const sectors = INDUSTRY_SECTORS.map((s) => ({ key: s.key, label: s.label }));

const operators = OPERATOR_HELP.map((o) => ({
  symbol: o.symbol,
  label: o.label,
  oneLiner: o.oneLiner,
  example: o.example,
}));

const vocab = {
  maxQueryLength: MAX_QUERY_LENGTH,
  metrics,
  sectors,
  operators,
};

const outPath = resolve(__dirname, "../../ai-service/app/ai/screener_vocab.json");
writeFileSync(outPath, JSON.stringify(vocab, null, 2) + "\n", "utf-8");
console.log(`Wrote ${metrics.length} metrics, ${sectors.length} sectors to ${outPath}`);
