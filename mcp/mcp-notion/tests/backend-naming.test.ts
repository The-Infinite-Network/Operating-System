import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(...segments: string[]) {
  return readFileSync(path.join(projectRoot, ...segments), "utf8");
}

describe("backend naming canon", () => {
  it("does not reintroduce banned legacy method declarations in tools.ts", () => {
    const source = readProjectFile("src", "tools.ts");
    const bannedDeclarations = [
      "async iehq_get_capabilities(",
      "async listDatabases(",
      "async getPage(",
      "async missionsList(",
      "async task_create(",
      "async timeline_log_event(",
      "async timeline_query_by_mission(",
      "async agentsList(",
      "async updateMissionStatus(",
      "async createTaskForMission(",
      "async updateTaskForMission(",
    ];

    for (const declaration of bannedDeclarations) {
      expect(source.includes(declaration), `Found banned declaration in tools.ts: ${declaration}`).toBe(false);
    }
  });

  it("does not reintroduce banned legacy method declarations in client.ts", () => {
    const source = readProjectFile("src", "client.ts");
    const bannedDeclarations = [
      "async listDatabases(",
      "async getPage(",
      "async missionUpsert(",
      "async updateMissionStatus(",
      "async createTaskForMission(",
      "async updateTaskForMission(",
      "async createRun(",
      "async endRun(",
      "async updateAAR(",
      "async listRunsForMission(",
      "async getAARByRunId(",
    ];

    for (const declaration of bannedDeclarations) {
      expect(source.includes(declaration), `Found banned declaration in client.ts: ${declaration}`).toBe(false);
    }
  });
});
