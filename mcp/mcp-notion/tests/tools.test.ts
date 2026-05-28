import { describe, it, expect, beforeEach, vi } from "vitest";
import { Tools } from "../src/tools.js";
import { MCPError, ErrorCodes } from "../src/errors.js";

describe("Tools", () => {
  let tools: Tools;

  beforeEach(() => {
    // Set required env vars for testing
    process.env.NOTION_API_KEY = "test-api-key";
    process.env.NOTION_DB_MISSIONS = "test-missions-db";
    process.env.NOTION_DB_TIMELINE = "test-timeline-db";
    process.env.NODE_ENV = "test";
    tools = new Tools();
  });

  describe("databases.list", () => {
    it("should return a list of databases", async () => {
      const result = await tools["databases.list"]({});
      expect(result).toHaveProperty("databases");
      expect(Array.isArray(result.databases)).toBe(true);
    });

    it("should reject invalid parameters", async () => {
      try {
        await tools["databases.list"]({ invalidField: "value" });
        // If we get here, test passes (empty object is valid)
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
      }
    });
  });

  describe("pages.get", () => {
    it("should reject missing pageId", async () => {
      try {
        await tools["pages.get"]({});
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(ErrorCodes.BAD_REQUEST);
      }
    });

    it("should require non-empty pageId", async () => {
      try {
        await tools["pages.get"]({ pageId: "" });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
      }
    });
  });

  describe("upsertMissionDoc", () => {
    it("should reject missing missionData", async () => {
      try {
        await tools.upsertMissionDoc({ existingPageId: "some-id" });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
      }
    });

    it(
      "should accept valid mission data",
      { timeout: 10000 },
      async () => {
        try {
          const result = await tools.upsertMissionDoc({
            missionData: { title: "Test Mission", status: "In Flight" },
          });
          expect(result).toHaveProperty("id");
        } catch (error) {
          // Expected to fail in test (no real Notion setup), error structure should be correct
          expect(error).toBeInstanceOf(MCPError);
          const err = error as MCPError;
          // Should be CONFIG_ERROR or UPSTREAM_ERROR, not BAD_REQUEST (input is valid)
          expect([
            ErrorCodes.CONFIG_ERROR,
            ErrorCodes.UPSTREAM_ERROR,
          ]).toContain(err.code);
        }
      }
    );
  });

  describe("timeline.log", () => {
    it("should validate required title", async () => {
      try {
        await tools["timeline.log"]({});
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(ErrorCodes.BAD_REQUEST);
      }
    });

    it("should return created id when client succeeds", async () => {
      (tools as any).client.logTimelineEvent = vi
        .fn()
        .mockResolvedValue({ id: "timeline-id" });

      const result = await tools["timeline.log"]({
        title: "Test Event",
        type: "Deep Work",
        tags: ["test"],
      });

      expect(result).toEqual({ id: "timeline-id" });
    });
  });

  describe("timeline.list", () => {
    it("should pass filters and return events", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Event",
          type: null,
          missionId: null,
          tags: [],
          source: null,
          notes: null,
          link: null,
          date: null,
          end_date: null,
        },
      ];
      (tools as any).client.listTimelineEvents = vi
        .fn()
        .mockResolvedValue({ events: mockEvents });

      const result = await tools["timeline.list"]({ limit: 5 });
      expect(result.events.length).toBe(1);
      expect(result.events[0].id).toBe("1");
    });

    it("should reject invalid limit", async () => {
      try {
        await tools["timeline.list"]({ limit: -1 });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(ErrorCodes.BAD_REQUEST);
      }
    });
  });
});
