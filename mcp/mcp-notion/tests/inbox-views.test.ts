import { describe, it, expect } from "vitest";
import { INBOX_VIEWS_SPEC } from "../src/inbox/views";

describe("inbox views spec", () => {
  it("defines expected views", () => {
    expect(INBOX_VIEWS_SPEC.map((v) => v.name)).toEqual([
      "INBOX – Captured",
      "INBOX – Triaged",
      "INBOX – Routed",
      "INBOX – Blocked",
      "INBOX – Duplicate",
      "INBOX – Archived",
    ]);
  });
});
