import { describe, expect, it } from "vitest";
import {
  candidateBundleTypes,
  fulcrumMoves,
  fulcrumReviewGate,
  fulcrumSourceFolder,
} from "./fulcrumSystem";

describe("fulcrum system seed contract", () => {
  it("anchors the current Ffc Drive folder as the candidate-only source", () => {
    expect(fulcrumSourceFolder.title).toBe("Ffc");
    expect(fulcrumSourceFolder.url).toBe(
      "https://drive.google.com/drive/folders/1xbCiYA5GWSX_HPqgzXZLXlITVNrjtiqy",
    );
    expect(fulcrumReviewGate.mode).toBe("candidate-only");
    expect(fulcrumReviewGate.blockers).toContain("Provided Drive file URL returned 404 for this connection.");
  });

  it("models six mastery moves with the first three populated from source material", () => {
    expect(fulcrumMoves).toHaveLength(6);
    expect(fulcrumMoves.slice(0, 3).map((move) => move.title)).toEqual([
      "Mastering Yourself",
      "Mastering the Ability to Reason",
      "Mastering the Art of Building the Right Teams",
    ]);
    expect(fulcrumMoves[0].stages.map((stage) => stage.name)).toEqual([
      "Ignite",
      "Blueprint",
      "Fortify",
      "Anchor",
      "Envision",
      "Position",
      "Launch",
    ]);
    expect(fulcrumMoves.slice(3).every((move) => move.status === "reserved")).toBe(true);
  });

  it("exposes the full candidate bundle queue required by Leviathan", () => {
    expect(candidateBundleTypes).toEqual([
      "KB Article",
      "ARK Spec",
      "Reference Card",
      "SKILL.md",
      "Delta Report",
      "Timeline Payload",
      "Manifest",
    ]);
  });
});
