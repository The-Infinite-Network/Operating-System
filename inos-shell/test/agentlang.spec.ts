import { describe, it, expect } from "vitest";
import { parseProgram, ALangError, E001, E002, E003, E005, E006, E007, E008 } from "../src/agentlang";

const VALID = [
  "∃[<lang> = new] ( <compress>≡5x ∨ <ambig>≡∅ )",
  "∀● ( ¬<active>=false ∧ <role>≡operator )",
  "<alpha> := [1, 2, 3]",
  "<cfg> := { <primitives>=256, <mode>=\"fast\" }",
  "● ⊕ <spec> : { <primitives>=256 }",
  "● ⊗ <spec> : 3",
  "○ → ● : \"handoff\"",
  "Θ( <x>=1, <y>=2 )",
  "( <a>=1 ∧ <b>=2 ) ∨ <c>=3",
  "<x>=1 = <y>=1",
  "block { ● ⊕ <n> : 1 ; ● ∆ <n> : 2 }",
  "(<k>=1) ⇒ (<k>=1 ∨ <k>=2)",
];

const INVALID: Array<[string, string]> = [
  ["<k", E006],
  ["{ <k>=1", E002],
  ["[<k>=1,]", E001],
  ["∀[ ] ( <x>=1 )", E003],
  ["∀[<x> <y>] ( <z>=1 )", E003],
  ["⇒ ( <x>=1 )", E007],
  ["<x>=1 ⇒", E007],
  ["⇒(1,2)", E008],
  ["● ⊕", E005],
  ["block [ <x>=1 ]", E001],
  ["{ <x>=1 ; <y>=2 }", E001],
  ["block { <x>=1, <y>=2 }", E001],
];

describe("AGENTLANG v0.1.1", () => {
  it("parses all valid cases", () => {
    for (const src of VALID) {
      expect(() => parseProgram(src)).not.toThrow();
    }
  });

  it("rejects invalid cases with correct codes", () => {
    for (const [src, code] of INVALID) {
      try {
        parseProgram(src);
        throw new Error(`Expected failure for ${src}`);
      } catch (err) {
        const e = err as ALangError;
        expect(e.code).toBe(code);
      }
    }
  });
});
