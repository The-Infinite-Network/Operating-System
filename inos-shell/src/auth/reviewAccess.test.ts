import { describe, expect, it } from "vitest";
import { canAccessEntity, validateReviewCode, type ReviewSession } from "./reviewAccess";

describe("review access contract", () => {
  it("accepts the FFC review code for the Fulcrum/FFC intranet", () => {
    const result = validateReviewCode("FFC-REVIEW-2026", "FFC");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.grant.entity).toBe("FFC");
      expect(result.grant.access).toBe("tester");
    }
  });

  it("rejects an entity-specific code for the wrong intranet", () => {
    const result = validateReviewCode("FFC-REVIEW-2026", "GGP");

    expect(result.ok).toBe(false);
  });

  it("allows INOS-level access across entity review gates", () => {
    const session: ReviewSession = {
      name: "Owner",
      email: "",
      entity: "INOS",
      access: "owner",
      grantedAt: "2026-06-08T00:00:00.000Z",
    };

    expect(canAccessEntity(session, "FFC")).toBe(true);
    expect(canAccessEntity(session, "GGP")).toBe(true);
  });
});
