import { describe, it, expect } from "vitest";
import {
  normalizeSourceType,
  normalizeDestinationDb,
  normalizeRoutingStatus,
  computeRoutingKey,
} from "../src/inbox/normalize";

describe("inbox normalize helpers", () => {
  it("maps source_type label to code", () => {
    const res = normalizeSourceType({ source_type: "Url" });
    expect(res?.source_type_code).toBe("url");
  });

  it("maps additional source_type labels to codes", () => {
    expect(normalizeSourceType({ source_type: "File" })?.source_type_code).toBe(
      "doc"
    );
    expect(normalizeSourceType({ source_type: "Scan" })?.source_type_code).toBe(
      "image"
    );
    expect(normalizeSourceType({ source_type: "Note" })?.source_type_code).toBe(
      "other"
    );
  });

  it("maps destination label to code", () => {
    const res = normalizeDestinationDb({ destination_db: "Runs AARs" });
    expect(res?.destination_db_code).toBe("RUNS_AARS");
  });

  it("maps routing status label to code", () => {
    const res = normalizeRoutingStatus({ routing_status: "Blocked" });
    expect(res?.routing_status_code).toBe("blocked");
  });

  it("maps captured/classified/closed labels to codes", () => {
    expect(
      normalizeRoutingStatus({ routing_status: "Captured" })?.routing_status_code
    ).toBe("new");
    expect(
      normalizeRoutingStatus({ routing_status: "Classified" })?.routing_status_code
    ).toBe("triaged");
    expect(
      normalizeRoutingStatus({ routing_status: "Closed" })?.routing_status_code
    ).toBe("archived");
  });

  it("prefers code when provided", () => {
    const res = normalizeDestinationDb({
      destination_db_code: "RUNS_AARS",
      destination_db: "Drifted Label",
    });
    expect(res?.destination_db_code).toBe("RUNS_AARS");
    expect(res?.destination_db_select).toBe("Runs AARs");
  });

  it("computes routing key", () => {
    const key = computeRoutingKey({
      lane: "execution",
      layer: "L1",
      object_type: "task",
      destination_db_code: "TASKS",
    });
    expect(key).toBe("execution:L1:task:TASKS");
  });
});
