/**
 * WAR Ops Tools Tests
 */

import { describe, it, expect } from "vitest";
import { parseMissionBrief } from "../src/war-ops/parser.js";
import { WarOpsTools } from "../src/war-ops/tools.js";

describe("WAR Ops Parser", () => {
  it("should parse a simple mission brief", () => {
    const brief = `
Mission Title: Test Mission
Objective: Complete the test
Status: Proposed
Priority: P1
Due Date: 2025-12-31
Acceptance Tests:
- Test passes
- Documentation complete
`;

    const parsed = parseMissionBrief(brief);

    expect(parsed.mission_title).toBe("Test Mission");
    expect(parsed.mission_objective).toBe("Complete the test");
    expect(parsed.status).toBe("Proposed");
    expect(parsed.priority).toBe("P1");
    expect(parsed.due_date).toBe("2025-12-31");
    expect(parsed.acceptance_tests).toHaveLength(2);
    expect(parsed.mission_type).toBe("standard");
  });

  it("should detect quick_task type", () => {
    const brief = `
Mission Title: Quick Task
Objective: Do something
Assigned To: John Doe
Start Date: 2025-01-01
Due Date: 2025-01-02
`;

    const parsed = parseMissionBrief(brief);

    expect(parsed.mission_type).toBe("quick_task");
  });

  it("should warn when acceptance tests are missing", () => {
    const brief = `
Mission Title: Mission Without Tests
Objective: Do something
`;

    const parsed = parseMissionBrief(brief);

    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it("should extract mission code", () => {
    const brief = `
Mission Title: Test
Mission Code: TEST-001
`;

    const parsed = parseMissionBrief(brief);

    expect(parsed.mission_code).toBe("TEST-001");
  });

  it("should extract multiple objectives", () => {
    const brief = `
Mission Title: Test
Objectives:
- Objective 1
- Objective 2
- Objective 3
Acceptance Tests:
- Test 1
`;

    const parsed = parseMissionBrief(brief);

    expect(parsed.objectives).toHaveLength(3);
    expect(parsed.objectives?.[0]).toBe("Objective 1");
  });
});

describe("WAR Ops Tools", () => {
  it("should create WAR Ops tools instance", () => {
    const tools = new WarOpsTools();
    expect(tools).toBeInstanceOf(WarOpsTools);
  });

  // Note: Full integration tests would require:
  // - Mock NotionClient
  // - Test each tool method with various inputs
  // - Verify safety boundaries
  // - Test Notion write operations (dry_run vs commit)
  // - Test timeline event generation
});

