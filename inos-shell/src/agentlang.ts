// AGENTLANG Reference Implementation v0.1.1 (TypeScript)
// - Deterministic lexer (priority-safe)
// - Pratt parser (single-pass friendly)
// - AST schema

export class ALangError extends Error {
  code: string;
  msg: string;
  pos: number;

  constructor(code: string, msg: string, pos: number) {
    super(`${code}@${pos}: ${msg}`);
    this.code = code;
    this.msg = msg;
    this.pos = pos;
  }
}

export const E001 = "E001"; // UnknownToken
export const E002 = "E002"; // UnmatchedDelimiter
export const E003 = "E003"; // InvalidBinder
export const E004 = "E004"; // AmbiguousParse (should not occur)
export const E005 = "E005"; // InvalidActionForm
export const E006 = "E006"; // InvalidKeyRef
export const E007 = "E007"; // InvalidRuleForm
export const E008 = "E008"; // InvalidCallHead

export enum TokKind {
  EOF = "EOF",
  NEWLINE = "NEWLINE",
  IDENT = "IDENT",
  INT = "INT",
  FLOAT = "FLOAT",
  STRING = "STRING",
  KEY = "KEY",
  SYMBOL = "SYMBOL",
  PUNCT = "PUNCT",
  OP = "OP",
}

export type Token = {
  kind: TokKind;
  value: string;
  pos: number;
};

const UNICODE_SYMBOLS = new Set("⊕⊖∆→⊗●○◆◇∃∀⇒∧∨≡¬∅Θ".split(""));
const SYMBOLREF_SET = new Set("●○◆◇Θ".split(""));
const CALLABLE_SET = new Set("Θ●○◆◇".split(""));
const ASCII_PUNCT = new Set("{}[]() :,=<>|+-*/;".split(""));
const DURATION_SUFFIXES = ["ms", "s", "m", "h", "d", "w", "weeks", "days"];

function isIdentStart(ch: string) {
  return /[A-Za-z_]/.test(ch);
}

function isIdentPart(ch: string) {
  return /[A-Za-z0-9_-]/.test(ch);
}

export function lex(src: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  const n = src.length;

  const peek = (k = 0) => {
    const j = i + k;
    return j >= 0 && j < n ? src[j] : "\0";
  };

  const bump = () => {
    const ch = peek(0);
    i += 1;
    return ch;
  };

  while (i < n) {
    const ch = peek(0);

    // whitespace (newline significant at top-level)
    if (ch === " " || ch === "\t") {
      i += 1;
      continue;
    }
    if (ch === "\r") {
      const pos = i;
      if (peek(1) === "\n") {
        i += 2;
      } else {
        i += 1;
      }
      toks.push({ kind: TokKind.NEWLINE, value: "\\n", pos });
      continue;
    }
    if (ch === "\n") {
      const pos = i;
      i += 1;
      toks.push({ kind: TokKind.NEWLINE, value: "\\n", pos });
      continue;
    }

    // comments
    if (ch === "#") {
      while (i < n && src[i] !== "\n" && src[i] !== "\r") {
        i += 1;
      }
      continue;
    }

    const pos = i;

    // OP ':='
    if (ch === ":" && peek(1) === "=") {
      i += 2;
      toks.push({ kind: TokKind.OP, value: ":=", pos });
      continue;
    }

    // STRING
    if (ch === '"') {
      bump();
      const out: string[] = [];
      while (true) {
        if (i >= n) throw new ALangError(E002, "Unterminated string", pos);
        const c = bump();
        if (c === '"') break;
        if (c === "\\") {
          if (i >= n) throw new ALangError(E002, "Unterminated escape", pos);
          const esc = bump();
          if (esc === '"' || esc === "\\") out.push(esc);
          else out.push(esc);
        } else {
          out.push(c);
        }
      }
      toks.push({ kind: TokKind.STRING, value: out.join(""), pos });
      continue;
    }

    // KEY: <IDENT>
    if (ch === "<") {
      let j = i + 1;
      if (j < n && isIdentStart(src[j])) {
        j += 1;
        while (j < n && isIdentPart(src[j])) j += 1;
        if (j < n && src[j] === ">") {
          const keyname = src.slice(i + 1, j);
          i = j + 1;
          toks.push({ kind: TokKind.KEY, value: keyname, pos });
          continue;
        }
        throw new ALangError(E006, "Invalid KeyRef", pos);
      }
    }

    // NUMBER: FLOAT before INT
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9]/.test(src[j])) j += 1;
      if (j < n && src[j] === "." && j + 1 < n && /[0-9]/.test(src[j + 1])) {
        let k = j + 1;
        while (k < n && /[0-9]/.test(src[k])) k += 1;
        const num = src.slice(i, k);
        i = k;
        if (i < n && src[i] === "%") {
          i += 1;
          toks.push({ kind: TokKind.IDENT, value: num + "%", pos });
        } else {
          toks.push({ kind: TokKind.FLOAT, value: num, pos });
        }
        continue;
      }

      const numInt = src.slice(i, j);
      i = j;
      if (i < n && src[i] === "%") {
        i += 1;
        toks.push({ kind: TokKind.IDENT, value: numInt + "%", pos });
        continue;
      }

      let matched: string | null = null;
      for (const suf of [...DURATION_SUFFIXES].sort((a, b) => b.length - a.length)) {
        if (src.startsWith(suf, i)) {
          matched = suf;
          break;
        }
      }
      if (matched) {
        i += matched.length;
        toks.push({ kind: TokKind.IDENT, value: numInt + matched, pos });
      } else if (i < n && isIdentStart(src[i])) {
        let k = i;
        while (k < n && isIdentPart(src[k])) k += 1;
        const ident = numInt + src.slice(i, k);
        i = k;
        toks.push({ kind: TokKind.IDENT, value: ident, pos });
      } else {
        toks.push({ kind: TokKind.INT, value: numInt, pos });
      }
      continue;
    }

    // UNICODE SYMBOL
    if (UNICODE_SYMBOLS.has(ch)) {
      bump();
      toks.push({ kind: TokKind.SYMBOL, value: ch, pos });
      continue;
    }

    // IDENT
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < n && isIdentPart(src[j])) j += 1;
      const ident = src.slice(i, j);
      i = j;
      toks.push({ kind: TokKind.IDENT, value: ident, pos });
      continue;
    }

    // ASCII punct
    if (ASCII_PUNCT.has(ch)) {
      bump();
      toks.push({ kind: TokKind.PUNCT, value: ch, pos });
      continue;
    }

    throw new ALangError(E001, `Unknown token starting with ${JSON.stringify(ch)}`, pos);
  }

  toks.push({ kind: TokKind.EOF, value: "", pos: n });
  return toks;
}

// =========================
// AST
// =========================
export type Node = { pos: number };

export type Scalar = Node & { value: any };
export type KeyRef = Node & { name: string };
export type SymbolRef = Node & { sym: string; sub?: number | null };

export type Expr = Node & {
  kind:
    | "RefExpr"
    | "MapExpr"
    | "ListExpr"
    | "KeyedExpr"
    | "CallExpr"
    | "UnaryExpr"
    | "BinaryExpr"
    | "QuantifiedExpr"
    | "ScalarExpr";
  [k: string]: any;
};

export type Stmt = Node & {
  kind: "ExprStmt" | "DefinitionStmt" | "RuleStmt" | "BlockStmt" | "ActionStmt";
  [k: string]: any;
};

export type Program = Node & { stmts: Stmt[] };

// =========================
// Parser (Pratt)
// =========================
export class Parser {
  private toks: Token[];
  private i: number;

  constructor(toks: Token[]) {
    this.toks = toks;
    this.i = 0;
  }

  private cur(): Token {
    return this.toks[this.i];
  }

  private at(kind: TokKind, val?: string): boolean {
    const t = this.cur();
    if (t.kind !== kind) return false;
    if (val !== undefined && t.value !== val) return false;
    return true;
  }

  private eat(kind: TokKind, val?: string): Token {
    if (!this.at(kind, val)) {
      const t = this.cur();
      if (kind === TokKind.PUNCT && [")", "]", "}"].includes(val || "")) {
        throw new ALangError(E002, "Unmatched delimiter", t.pos);
      }
      throw new ALangError(
        E001,
        `Expected ${kind}${val ? " " + val : ""}, got ${t.kind}:${t.value}`,
        t.pos
      );
    }
    const t = this.cur();
    this.i += 1;
    return t;
  }

  private tryEat(kind: TokKind, val?: string): Token | null {
    if (this.at(kind, val)) return this.eat(kind, val);
    return null;
  }

  private skipNewlines() {
    while (this.at(TokKind.NEWLINE)) this.eat(TokKind.NEWLINE);
  }

  private nextIsLParen() {
    const t = this.toks[this.i + 1];
    return t && t.kind === TokKind.PUNCT && t.value === "(";
  }

  private nextNonNewline(idx: number): Token | null {
    let j = idx;
    while (j < this.toks.length) {
      if (this.toks[j].kind !== TokKind.NEWLINE) return this.toks[j];
      j += 1;
    }
    return null;
  }

  program(): Program {
    const stmts: Stmt[] = [];
    this.skipNewlines();
    while (!this.at(TokKind.EOF)) {
      stmts.push(this.statement());
      if (this.at(TokKind.EOF)) break;
      if (this.at(TokKind.NEWLINE)) {
        this.skipNewlines();
        continue;
      }
      const t = this.cur();
      if (t.kind === TokKind.PUNCT && t.value === ";") {
        throw new ALangError(E001, "Unexpected ';' at top-level", t.pos);
      }
      throw new ALangError(E001, "Expected NEWLINE between statements", t.pos);
    }
    return { pos: 0, stmts };
  }

  private statement(): Stmt {
    this.skipNewlines();
    const t = this.cur();

    if (t.kind === TokKind.SYMBOL && t.value === "⇒") {
      if (this.nextIsLParen()) {
        const nxt = this.nextNonNewline(this.i + 2);
        if (nxt && [TokKind.INT, TokKind.FLOAT, TokKind.STRING].includes(nxt.kind)) {
          throw new ALangError(E008, "Invalid call head", t.pos);
        }
        throw new ALangError(E007, "Invalid rule form", t.pos);
      }
      throw new ALangError(E007, "Invalid rule form", t.pos);
    }

    if (t.kind === TokKind.IDENT && t.value === "block") {
      return this.blockStmt();
    }

    if (t.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(t.value)) {
      const t1 = this.toks[this.i + 1];
      if (t1 && t1.kind === TokKind.SYMBOL && ["⊕", "⊖", "∆", "→", "⊗"].includes(t1.value)) {
        return this.actionStmt();
      }
    }

    if (this.looksLikeDefinitionColonEq()) {
      return this.definitionStmt();
    }

    const expr = this.expr(0);
    if (this.tryEat(TokKind.SYMBOL, "⇒")) {
      if (this.at(TokKind.EOF) || this.at(TokKind.NEWLINE) || this.at(TokKind.PUNCT, "}")) {
        throw new ALangError(E007, "Invalid rule form", this.cur().pos);
      }
      const rhs = this.expr(0);
      return { kind: "RuleStmt", pos: expr.pos, lhs: expr, rhs };
    }

    if (expr.kind === "BinaryExpr" && ["=", "≡"].includes(expr.op)) {
      if (expr.lhs.kind === "RefExpr" && ("ref" in expr.lhs)) {
        const ref = expr.lhs.ref;
        if (ref && ("name" in ref || "sym" in ref)) {
          return { kind: "DefinitionStmt", pos: expr.pos, lhs: ref, op: expr.op, rhs: expr.rhs };
        }
      }
    }

    return { kind: "ExprStmt", pos: expr.pos, expr };
  }

  private looksLikeDefinitionColonEq(): boolean {
    const t0 = this.cur();
    if (t0.kind === TokKind.KEY || t0.kind === TokKind.IDENT) {
      const t1 = this.toks[this.i + 1];
      return t1 && t1.kind === TokKind.OP && t1.value === ":=";
    }
    if (t0.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(t0.value)) {
      const t1 = this.toks[this.i + 1];
      return t1 && t1.kind === TokKind.OP && t1.value === ":=";
    }
    return false;
  }

  private definitionStmt(): Stmt {
    const pos = this.cur().pos;
    const lhs = this.lhsRef();
    const opTok = this.eat(TokKind.OP, ":=");
    const rhs = this.expr(0);
    return { kind: "DefinitionStmt", pos, lhs, op: opTok.value, rhs };
  }

  private blockStmt(): Stmt {
    const pos = this.eat(TokKind.IDENT, "block").pos;
    this.eat(TokKind.PUNCT, "{");
    const stmts: Stmt[] = [];
    this.skipNewlines();
    if (this.tryEat(TokKind.PUNCT, "}")) {
      return { kind: "BlockStmt", pos, stmts };
    }
    while (true) {
      stmts.push(this.statement());
      this.skipNewlines();
      if (this.tryEat(TokKind.PUNCT, ";")) {
        this.skipNewlines();
        if (this.tryEat(TokKind.PUNCT, "}")) break;
        continue;
      }
      if (this.tryEat(TokKind.PUNCT, "}")) break;
      throw new ALangError(E001, "Expected ';' or '}' in block", this.cur().pos);
    }
    return { kind: "BlockStmt", pos, stmts };
  }

  private actionStmt(): Stmt {
    const actorTok = this.eat(TokKind.SYMBOL);
    const actor = this.symbolRefFromToken(actorTok);
    this.skipNewlines();
    const op = this.eat(TokKind.SYMBOL).value;
    this.skipNewlines();
    const target = this.actionTarget();
    let payload = null;
    if (this.tryEat(TokKind.PUNCT, ":")) {
      payload = this.actionPayload();
    }
    return { kind: "ActionStmt", pos: actorTok.pos, actor, op, target, payload };
  }

  private actionTarget(): any {
    this.skipNewlines();
    const t = this.cur();
    if (t.kind === TokKind.KEY) {
      const tok = this.eat(TokKind.KEY);
      return { pos: tok.pos, name: tok.value } as KeyRef;
    }
    if (t.kind === TokKind.IDENT) {
      const tok = this.eat(TokKind.IDENT);
      return { pos: tok.pos, value: tok.value } as Scalar;
    }
    if (t.kind === TokKind.STRING) {
      const tok = this.eat(TokKind.STRING);
      return { pos: tok.pos, value: tok.value } as Scalar;
    }
    if (t.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(t.value)) {
      const tok = this.eat(TokKind.SYMBOL);
      return this.symbolRefFromToken(tok);
    }
    if (t.kind === TokKind.PUNCT && t.value === "{") return this.mapExpr();
    if (t.kind === TokKind.PUNCT && t.value === "[") return this.listExpr();
    throw new ALangError(E005, "Invalid Action target", t.pos);
  }

  private actionPayload(): any {
    this.skipNewlines();
    const t = this.cur();
    if (t.kind === TokKind.PUNCT && t.value === "{") return this.mapExpr();
    if (t.kind === TokKind.PUNCT && t.value === "[") return this.listExpr();
    return this.scalarExpr();
  }

  private lhsRef(): KeyRef | SymbolRef {
    const t = this.cur();
    if (t.kind === TokKind.KEY) {
      const tok = this.eat(TokKind.KEY);
      return { pos: tok.pos, name: tok.value };
    }
    if (t.kind === TokKind.IDENT) {
      const tok = this.eat(TokKind.IDENT);
      return { pos: tok.pos, name: tok.value };
    }
    if (t.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(t.value)) {
      const tok = this.eat(TokKind.SYMBOL);
      return this.symbolRefFromToken(tok);
    }
    throw new ALangError(E006, "Invalid LHS for definition", t.pos);
  }

  private precedence: Record<string, number> = {
    "=": 30,
    "≡": 30,
    "∧": 20,
    "∨": 10,
    "|": 10,
  };

  private expr(minBp: number): Expr {
    this.skipNewlines();
    let left = this.nud();
    while (true) {
      this.skipNewlines();
      const t = this.cur();
      if (t.kind === TokKind.SYMBOL && t.value === "⇒") break;
      if ((t.kind === TokKind.SYMBOL || t.kind === TokKind.PUNCT) && t.value in this.precedence) {
        const op = t.value;
        const lbp = this.precedence[op];
        if (lbp < minBp) break;
        this.eat(t.kind, op);
        const right = this.expr(lbp + 1);
        left = { kind: "BinaryExpr", pos: left.pos, op, lhs: left, rhs: right };
        continue;
      }
      break;
    }
    return left;
  }

  private invalidCallHead(): boolean {
    const t = this.cur();
    if (t.kind !== TokKind.SYMBOL) return false;
    if (!this.nextIsLParen()) return false;
    return !CALLABLE_SET.has(t.value);
  }

  private nud(): Expr {
    this.skipNewlines();
    const t = this.cur();

    if (t.kind === TokKind.SYMBOL && (t.value === "∀" || t.value === "∃")) {
      const qt = this.eat(TokKind.SYMBOL).value;
      const binder = this.binder();
      const body = this.expr(0);
      return { kind: "QuantifiedExpr", pos: t.pos, quant: qt, binder, body };
    }

    if (t.kind === TokKind.SYMBOL && t.value === "¬") {
      const op = this.eat(TokKind.SYMBOL).value;
      const rhs = this.expr(100);
      return { kind: "UnaryExpr", pos: t.pos, op, rhs };
    }

    if (t.kind === TokKind.PUNCT && t.value === "(") {
      this.eat(TokKind.PUNCT, "(");
      const inner = this.expr(0);
      this.eat(TokKind.PUNCT, ")");
      return inner;
    }

    if (t.kind === TokKind.PUNCT && t.value === "{") return this.mapExpr();
    if (t.kind === TokKind.PUNCT && t.value === "[") return this.listExpr();

    if (this.invalidCallHead()) throw new ALangError(E008, "Invalid call head", t.pos);

    if (t.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(t.value)) {
      const symref = this.symbolRef();
      if (CALLABLE_SET.has(symref.sym) && this.at(TokKind.PUNCT, "(")) {
        return this.callExpr(symref);
      }
      return { kind: "RefExpr", pos: symref.pos, ref: symref };
    }

    if (t.kind === TokKind.KEY || t.kind === TokKind.IDENT) {
      const key = this.keyRef();
      if (this.at(TokKind.PUNCT, ":") || this.at(TokKind.PUNCT, "=")) {
        const op = this.eat(TokKind.PUNCT).value;
        const val = this.atom();
        return { kind: "KeyedExpr", pos: key.pos, key, op, value: val };
      }
      return { kind: "RefExpr", pos: key.pos, ref: key };
    }

    return this.scalarExpr();
  }

  private atom(): Expr {
    this.skipNewlines();
    const t = this.cur();
    if (t.kind === TokKind.PUNCT && t.value === "{") return this.mapExpr();
    if (t.kind === TokKind.PUNCT && t.value === "[") return this.listExpr();
    if (t.kind === TokKind.PUNCT && t.value === "(") {
      this.eat(TokKind.PUNCT, "(");
      const e = this.expr(0);
      this.eat(TokKind.PUNCT, ")");
      return e;
    }
    if (this.invalidCallHead()) throw new ALangError(E008, "Invalid call head", t.pos);
    if (t.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(t.value)) {
      const symref = this.symbolRef();
      if (CALLABLE_SET.has(symref.sym) && this.at(TokKind.PUNCT, "(")) {
        return this.callExpr(symref);
      }
      return { kind: "RefExpr", pos: symref.pos, ref: symref };
    }
    if (t.kind === TokKind.KEY || t.kind === TokKind.IDENT) {
      const key = this.keyRef();
      if (this.at(TokKind.PUNCT, ":") || this.at(TokKind.PUNCT, "=")) {
        const op = this.eat(TokKind.PUNCT).value;
        const val = this.atom();
        return { kind: "KeyedExpr", pos: key.pos, key, op, value: val };
      }
      return { kind: "RefExpr", pos: key.pos, ref: key };
    }
    return this.scalarExpr();
  }

  private keyRef(): KeyRef {
    this.skipNewlines();
    const t = this.cur();
    if (t.kind === TokKind.KEY) {
      const tok = this.eat(TokKind.KEY);
      return { pos: tok.pos, name: tok.value };
    }
    if (t.kind === TokKind.IDENT) {
      const tok = this.eat(TokKind.IDENT);
      return { pos: tok.pos, name: tok.value };
    }
    throw new ALangError(E006, "Invalid KeyRef", t.pos);
  }

  private symbolRefFromToken(tok: Token): SymbolRef {
    if (!SYMBOLREF_SET.has(tok.value)) throw new ALangError(E001, `Invalid SymbolRef ${tok.value}`, tok.pos);
    let sub: number | null = null;
    if (this.at(TokKind.IDENT)) {
      const ident = this.cur().value;
      if (ident.startsWith("_") && /^[0-9]+$/.test(ident.slice(1))) {
        sub = parseInt(ident.slice(1), 10);
        this.eat(TokKind.IDENT);
      }
    }
    return { pos: tok.pos, sym: tok.value, sub };
  }

  private symbolRef(): SymbolRef {
    const tok = this.eat(TokKind.SYMBOL);
    return this.symbolRefFromToken(tok);
  }

  private callExpr(head: SymbolRef): Expr {
    const pos = head.pos;
    this.eat(TokKind.PUNCT, "(");
    const args: Expr[] = [];
    this.skipNewlines();
    if (this.tryEat(TokKind.PUNCT, ")")) {
      return { kind: "CallExpr", pos, head, args };
    }
    while (true) {
      args.push(this.expr(0));
      this.skipNewlines();
      if (this.tryEat(TokKind.PUNCT, ",")) {
        this.skipNewlines();
        continue;
      }
      this.eat(TokKind.PUNCT, ")");
      break;
    }
    return { kind: "CallExpr", pos, head, args };
  }

  private mapExpr(): Expr {
    const pos = this.eat(TokKind.PUNCT, "{").pos;
    const items: Array<[KeyRef | string, Expr]> = [];
    this.skipNewlines();
    if (this.tryEat(TokKind.PUNCT, "}")) return { kind: "MapExpr", pos, items };
    while (true) {
      this.skipNewlines();
      const t = this.cur();
      if (!(t.kind === TokKind.KEY || t.kind === TokKind.IDENT)) {
        throw new ALangError(E001, "Expected map key", t.pos);
      }
      const key = this.keyRef();
      if (this.at(TokKind.PUNCT, ":") || this.at(TokKind.PUNCT, "=")) {
        this.eat(TokKind.PUNCT);
      } else {
        throw new ALangError(E001, "Expected ':' or '=' in map pair", this.cur().pos);
      }
      const val = this.expr(0);
      items.push([key, val]);

      this.skipNewlines();
      if (this.at(TokKind.PUNCT, ";")) {
        throw new ALangError(E001, "Invalid ';' inside map", this.cur().pos);
      }
      if (this.tryEat(TokKind.PUNCT, ",")) {
        this.skipNewlines();
        continue;
      }
      this.eat(TokKind.PUNCT, "}");
      break;
    }
    return { kind: "MapExpr", pos, items };
  }

  private listExpr(): Expr {
    const pos = this.eat(TokKind.PUNCT, "[").pos;
    const items: Expr[] = [];
    this.skipNewlines();
    if (this.tryEat(TokKind.PUNCT, "]")) return { kind: "ListExpr", pos, items };
    while (true) {
      items.push(this.expr(0));
      this.skipNewlines();
      if (this.tryEat(TokKind.PUNCT, ",")) {
        this.skipNewlines();
        continue;
      }
      this.eat(TokKind.PUNCT, "]");
      break;
    }
    return { kind: "ListExpr", pos, items };
  }

  private scalarExpr(): Expr {
    this.skipNewlines();
    const t = this.cur();
    if (t.kind === TokKind.INT) {
      const tok = this.eat(TokKind.INT);
      return { kind: "ScalarExpr", pos: tok.pos, value: parseInt(tok.value, 10) };
    }
    if (t.kind === TokKind.FLOAT) {
      const tok = this.eat(TokKind.FLOAT);
      return { kind: "ScalarExpr", pos: tok.pos, value: parseFloat(tok.value) };
    }
    if (t.kind === TokKind.STRING) {
      const tok = this.eat(TokKind.STRING);
      return { kind: "ScalarExpr", pos: tok.pos, value: tok.value };
    }
    if (t.kind === TokKind.IDENT) {
      const tok = this.eat(TokKind.IDENT);
      return { kind: "ScalarExpr", pos: tok.pos, value: tok.value };
    }
    if (t.kind === TokKind.SYMBOL && ["●", "○", "◆", "◇", "∅", "Θ"].includes(t.value)) {
      const tok = this.eat(TokKind.SYMBOL);
      return { kind: "ScalarExpr", pos: tok.pos, value: tok.value };
    }
    throw new ALangError(E001, "Expected scalar", t.pos);
  }

  private binder(): any {
    this.skipNewlines();
    const t = this.cur();
    if (t.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(t.value)) {
      const sym = this.symbolRef();
      return { pos: sym.pos, kind: "symbol", symbol: sym };
    }

    if (t.kind === TokKind.PUNCT && t.value === "[") {
      const pos = this.eat(TokKind.PUNCT, "[").pos;
      const keys: Array<KeyRef | SymbolRef> = [];
      let constraint: Expr | null = null;

      this.skipNewlines();
      if (this.at(TokKind.PUNCT, "]")) throw new ALangError(E003, "Empty binder list invalid", pos);

      while (true) {
        this.skipNewlines();
        const cur = this.cur();
        if (cur.kind === TokKind.KEY || cur.kind === TokKind.IDENT) {
          keys.push(this.keyRef());
        } else if (cur.kind === TokKind.SYMBOL && SYMBOLREF_SET.has(cur.value)) {
          keys.push(this.symbolRef());
        } else {
          throw new ALangError(E003, "Invalid binder element", cur.pos);
        }

        this.skipNewlines();
        if (this.at(TokKind.PUNCT, ":") || this.at(TokKind.PUNCT, "=")) {
          this.eat(TokKind.PUNCT);
          constraint = this.expr(0);
          this.skipNewlines();
          this.eat(TokKind.PUNCT, "]");
          return { pos, kind: "list", keys, constraint };
        }
        if (this.tryEat(TokKind.PUNCT, ",")) {
          continue;
        }
        if (this.at(TokKind.PUNCT, "]")) break;
        throw new ALangError(E003, "Invalid binder element", this.cur().pos);
      }

      this.eat(TokKind.PUNCT, "]");
      return { pos, kind: "list", keys, constraint };
    }

    throw new ALangError(E003, "Invalid binder", t.pos);
  }
}

export function parseProgram(src: string): Program {
  const toks = lex(src);
  const p = new Parser(toks);
  return p.program();
}
