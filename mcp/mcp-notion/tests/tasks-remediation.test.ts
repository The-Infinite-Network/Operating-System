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

  it("reads shared TASKS rows through Related Mission and preserves Task Name/status fields", async () => {
    const notionClient = new NotionClient() as any;
    notionClient.config = {
      ...notionClient.config,
      NOTION_DB_TASKS: "shared-tasks-db",
    };
    notionClient.client = {
      databases: {
        retrieve: async () => ({
          properties: {
            "Related Mission": { type: "relation" },
          },
        }),
        query: async () => ({
          results: [
            {
              id: "task-123",
              properties: {
                "Task Name": {
                  title: [{ plain_text: "Shared TASKS smoke row" }],
                },
                Status: {
                  status: { name: "Backlog" },
                },
              },
            },
          ],
        }),
      },
    };

    await expect(
      notionClient["missions.tasks.list"]("mission-123")
    ).resolves.toEqual([
      expect.objectContaining({
        id: "task-123",
        title: "Shared TASKS smoke row",
        status: "Backlog",
      }),
    ]);
  });
});
