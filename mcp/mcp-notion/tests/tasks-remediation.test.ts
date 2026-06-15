import { beforeEach, describe, expect, it } from "vitest";
import { NotionClient } from "../src/client.js";
import { ErrorCodes, MCPError } from "../src/errors.js";

describe("Tasks remediation surface", () => {
  beforeEach(() => {
    process.env.NOTION_API_KEY = "test-api-key";
    process.env.NOTION_DB_MISSIONS = "test-missions-db";
    delete process.env.NOTION_DB_TASKS;
    delete process.env.NOTION_TASKS_DB_ID;
    process.env.NOTION_DB_BUILD_TASKS = "legacy-build-tasks-db";
    process.env.NOTION_DB_BUILD = "legacy-build-db";
    process.env.NODE_ENV = "test";
  });

  it("rejects BUILD_TASKS fallback during TASKS remediation", async () => {
    const notionClient = new NotionClient();

    await expect(notionClient.listTasks({})).rejects.toMatchObject<MCPError>({
      code: ErrorCodes.CONFIG_ERROR,
      message:
        "NOTION_DB_TASKS not configured. BUILD_TASKS/BUILD fallback is disabled during TASKS remediation.",
    });
  });

  it("rejects BUILD_TASKS fallback for mission task queries during TASKS remediation", async () => {
    const notionClient = new NotionClient();

    await expect(
      notionClient["missions.tasks.list"]("mission-123")
    ).rejects.toMatchObject<MCPError>({
      code: ErrorCodes.CONFIG_ERROR,
      message:
        "NOTION_DB_TASKS not configured. BUILD_TASKS/BUILD fallback is disabled during TASKS remediation.",
    });
  });
});
