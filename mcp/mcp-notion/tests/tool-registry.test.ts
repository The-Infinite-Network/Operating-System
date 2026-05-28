import { beforeEach, describe, expect, it } from "vitest";
import { PUBLIC_TOOL_NAMES, Tools } from "../src/tools.js";

describe("tool registry contract", () => {
  let tools: Tools;

  beforeEach(() => {
    process.env.NOTION_API_KEY = "test-api-key";
    process.env.NOTION_DB_MISSIONS = "test-missions-db";
    process.env.NOTION_DB_TIMELINE = "test-timeline-db";
    process.env.NODE_ENV = "test";
    tools = new Tools();
  });

  it("publishes a duplicate-free public tool list", () => {
    expect(new Set(PUBLIC_TOOL_NAMES).size).toBe(PUBLIC_TOOL_NAMES.length);
  });

  it("exposes every published tool name as a callable method on Tools", () => {
    for (const toolName of PUBLIC_TOOL_NAMES) {
      expect(typeof (tools as any)[toolName], `Missing callable tool: ${toolName}`).toBe(
        "function"
      );
    }
  });

  it("reports the same public tool list from system.capabilities", async () => {
    const result = await tools["system.capabilities"]({});

    expect(result.tools).toEqual(PUBLIC_TOOL_NAMES);
  });
});
