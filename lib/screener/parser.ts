/**
 * Recursive-descent parser for the screener query language. Produces a
 * positioned AST (every node carries `start`/`end` source offsets) so the
 * editor can highlight the exact span an error refers to.
 *
 * Grammar:
 *   query      := orExpr EOF
 *   orExpr     := andExpr { OR andExpr }
 *   andExpr    := compExpr { AND compExpr }
 *   compExpr   := addExpr [ compOp addExpr ] | SECTOR ("=" | "!=") STRING
 *   compOp     := ">" | "<" | ">=" | "<=" | "=" | "!="
 *   addExpr    := mulExpr { ("+" | "-") mulExpr }
 *   mulExpr    := unary { ("*" | "/") unary }
 *   unary      := "-" unary | primary
 *   primary    := NUMBER | METRIC | "(" orExpr ")"
 */

import { tokenize, type ScreenToken } from "./tokenizer";
import { INDUSTRY_SECTORS, type IndustrySector } from "../industry-sectors";
import type { PeerColumnDef } from "../peer-columns";

export type CompareOp = ">" | "<" | ">=" | "<=" | "=" | "!=";
export type ArithOp = "+" | "-" | "*" | "/";

export type ScreenNode =
  | { kind: "logical"; op: "and" | "or"; left: ScreenNode; right: ScreenNode; start: number; end: number }
  | { kind: "comparison"; op: CompareOp; left: ScreenNode; right: ScreenNode; start: number; end: number }
  | { kind: "arith"; op: ArithOp; left: ScreenNode; right: ScreenNode; start: number; end: number }
  | { kind: "neg"; operand: ScreenNode; start: number; end: number }
  | { kind: "number"; value: number; start: number; end: number }
  | { kind: "metric"; column: PeerColumnDef; start: number; end: number }
  | { kind: "sectorEq"; negated: boolean; sector: IndustrySector; start: number; end: number };

export interface ScreenError {
  message: string;
  start: number;
  end: number;
}

export type ParseResult = { ok: true; ast: ScreenNode } | { ok: false; error: ScreenError };

function resolveSector(name: string): IndustrySector | undefined {
  const norm = name.trim().toLowerCase();
  return INDUSTRY_SECTORS.find((s) => s.key === norm || s.label.toLowerCase() === norm || s.yahooSector.toLowerCase() === norm);
}

class Parser {
  private tokens: ScreenToken[];
  private pos = 0;
  private sourceLength: number;

  constructor(tokens: ScreenToken[], sourceLength: number) {
    this.tokens = tokens;
    this.sourceLength = sourceLength;
  }

  private peek(): ScreenToken | undefined {
    return this.tokens[this.pos];
  }

  private next(): ScreenToken | undefined {
    return this.tokens[this.pos++];
  }

  private here(): number {
    return this.peek()?.start ?? this.sourceLength;
  }

  private fail(message: string, start?: number, end?: number): never {
    const s = start ?? this.here();
    const e = end ?? (this.peek()?.end ?? this.sourceLength);
    throw { message, start: s, end: e } satisfies ScreenError;
  }

  parseQuery(): ScreenNode {
    if (this.tokens.length === 0) {
      this.fail("Type a condition to get started, e.g. Market Cap > 1000", 0, 0);
    }
    const node = this.parseOr();
    if (this.pos < this.tokens.length) {
      const t = this.tokens[this.pos];
      this.fail(`Unexpected "${t.text}" here`, t.start, t.end);
    }
    return node;
  }

  private parseOr(): ScreenNode {
    let left = this.parseAnd();
    while (this.peek()?.type === "or") {
      this.next();
      const right = this.parseAnd();
      left = { kind: "logical", op: "or", left, right, start: left.start, end: right.end };
    }
    return left;
  }

  private parseAnd(): ScreenNode {
    let left = this.parseComp();
    while (this.peek()?.type === "and") {
      this.next();
      const right = this.parseComp();
      left = { kind: "logical", op: "and", left, right, start: left.start, end: right.end };
    }
    return left;
  }

  private parseComp(): ScreenNode {
    if (this.peek()?.type === "sector") {
      const sectorTok = this.next()!;
      const opTok = this.peek();
      if (!opTok || opTok.type !== "compare" || (opTok.text !== "=" && opTok.text !== "!=")) {
        this.fail(`"Sector" must be followed by = or != and a sector name, e.g. Sector = 'Technology'`, sectorTok.start, sectorTok.end);
      }
      this.next();
      const negated = opTok!.text === "!=";
      const strTok = this.peek();
      if (!strTok || strTok.type !== "string") {
        this.fail("Expected a sector name in quotes, e.g. 'Technology'", opTok!.end, opTok!.end);
      }
      this.next();
      const sector = resolveSector(strTok!.text);
      if (!sector) {
        const valid = INDUSTRY_SECTORS.map((s) => s.label).join(", ");
        this.fail(`Unknown sector "${strTok!.text}". Valid sectors: ${valid}`, strTok!.start, strTok!.end);
      }
      return { kind: "sectorEq", negated, sector: sector!, start: sectorTok.start, end: strTok!.end };
    }

    const left = this.parseAdd();
    const opTok = this.peek();
    if (opTok?.type === "compare") {
      this.next();
      const right = this.parseAdd();
      return { kind: "comparison", op: opTok.text as CompareOp, left, right, start: left.start, end: right.end };
    }
    return left;
  }

  private parseAdd(): ScreenNode {
    let left = this.parseMul();
    while (this.peek()?.type === "arith" && (this.peek()!.text === "+" || this.peek()!.text === "-")) {
      const opTok = this.next()!;
      const right = this.parseMul();
      left = { kind: "arith", op: opTok.text as ArithOp, left, right, start: left.start, end: right.end };
    }
    return left;
  }

  private parseMul(): ScreenNode {
    let left = this.parseUnary();
    while (this.peek()?.type === "arith" && (this.peek()!.text === "*" || this.peek()!.text === "/")) {
      const opTok = this.next()!;
      const right = this.parseUnary();
      left = { kind: "arith", op: opTok.text as ArithOp, left, right, start: left.start, end: right.end };
    }
    return left;
  }

  private parseUnary(): ScreenNode {
    if (this.peek()?.type === "arith" && this.peek()!.text === "-") {
      const opTok = this.next()!;
      const operand = this.parseUnary();
      return { kind: "neg", operand, start: opTok.start, end: operand.end };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ScreenNode {
    const t = this.peek();
    if (!t) {
      this.fail("Expected a metric or number here", this.sourceLength, this.sourceLength);
    }
    if (t!.type === "number") {
      this.next();
      return { kind: "number", value: t!.value!, start: t!.start, end: t!.end };
    }
    if (t!.type === "metric") {
      this.next();
      return { kind: "metric", column: t!.column!, start: t!.start, end: t!.end };
    }
    if (t!.type === "lparen") {
      this.next();
      const inner = this.parseOr();
      const closeTok = this.peek();
      if (!closeTok || closeTok.type !== "rparen") {
        this.fail('Missing closing ")"', inner.end, inner.end);
      }
      this.next();
      return { ...inner, start: t!.start, end: closeTok!.end };
    }
    if (t!.type === "unknown") {
      this.fail(`"${t!.text}" isn't a metric I recognize`, t!.start, t!.end);
    }
    this.fail(`Unexpected "${t!.text}" here`, t!.start, t!.end);
  }
}

export function parse(input: string): ParseResult {
  try {
    const tokens = tokenize(input);
    const parser = new Parser(tokens, input.length);
    const ast = parser.parseQuery();
    return { ok: true, ast };
  } catch (err) {
    if (err && typeof err === "object" && "message" in err && "start" in err && "end" in err) {
      return { ok: false, error: err as ScreenError };
    }
    return { ok: false, error: { message: "Couldn't parse this query", start: 0, end: input.length } };
  }
}
