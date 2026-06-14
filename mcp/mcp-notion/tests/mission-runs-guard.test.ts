import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotionClient } from "../src/client.js";
import { MCPError, ErrorCodes } from "../src/errors.js";

describe("Mission Runs write guard", () => {
  beforeEach(() => {
    process.env.NOTION_API_KEY = "test-api-key";
    process.env.NOTION_DB_MISSIONS = "test-missions-db";
    process.env.NOTION_DB_RUNS_AARS = "test-runs-db";
    process.env.NOTION_MISSION_RUNS_DB_ID = "test-runs-db";
    process.env.NODE_ENV = "test";
  });

  it("blocks runs.create when the Mission Runs database is in trash", async () => {
    const notionClient = new NotionClient();
    const databasesRetrieve = vi.fn().mockResolvedValue({
      id: "test-runs-db",
      in_trash: true,
      archived: false,
      title: [{ plain_text: "[WAR] Mission Runs & AARs" }],
    });
    const pagesCreate = vi.fn();

    (notionClient as any).client = {
      databases: { retrieve: databasesRetrieve },
      pages: {
        create: pagesCreate,
        retrieve: vi.fn(),
        update: vi.fn(),
      },
    };

    await expect(
      notionClient["runs.create"]({
        missionId: "mission-1",
      })
    ).rejects.toMatchObject<MCPError>({
      code: ErrorCodes.CONFIG_ERROR,
      message: "Write blocked: database test-runs-db is archived or in trash.",
    });

    expect(databasesRetrieve).toHaveBeenCalledWith({ database_id: "test-runs-db" });
    expect(pagesCreate).not.toHaveBeenCalled();
  });

  it("blocks runs.create when the Mission Runs parent page is archived", async () => {
    const notionClient = new NotionClient();
    const databasesRetrieve = vi.fn().mockResolvedValue({
      id: "test-runs-db",
      in_trash: false,
      archived: false,
      parent: { type: "page_id", page_id: "legacy-parent-page" },
      title: [{ plain_text: "[WAR] Mission Runs & AARs" }],
    });
    const pagesRetrieve = vi.fn().mockResolvedValue({
      id: "legacy-parent-page",
      in_trash: false,
      archived: true,
    });
    const pagesCreate = vi.fn();

    (notionClient as any).client = {
      databases: { retrieve: databasesRetrieve },
      pages: {
        create: pagesCreate,
        retrieve: pagesRetrieve,
        update: vi.fn(),
      },
    };

    await expect(
      notionClient["runs.create"]({
        missionId: "mission-1",
      })
    ).rejects.toMatchObject<MCPError>({
      code: ErrorCodes.CONFIG_ERROR,
      message:
        "Write blocked: database test-runs-db is parented under an archived or trashed page.",
    });

    expect(databasesRetrieve).toHaveBeenCalledWith({ database_id: "test-runs-db" });
    expect(pagesRetrieve).toHaveBeenCalledWith({ page_id: "legacy-parent-page" });
    expect(pagesCreate).not.toHaveBeenCalled();
  });
});
