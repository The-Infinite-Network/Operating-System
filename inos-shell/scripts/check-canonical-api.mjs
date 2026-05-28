import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const checks = [
  {
    label: "api.ts",
    file: path.join(root, "src", "api.ts"),
    bannedProperties: [
      "listMissions",
      "upsertMission",
      "listTasks",
      "createTaskForMission",
      "queryTimelineByMission",
      "createRun",
      "endRun",
      "updateAAR",
    ],
  },
  {
    label: "mcpClient.ts",
    file: path.join(root, "src", "services", "mcpClient.ts"),
    bannedProperties: [
      "missionsList",
      "tasksList",
      "timelineList",
      "missionCreate",
      "updateMissionStatus",
      "createTaskForMission",
      "updateTaskForMission",
      "createRun",
      "listRunsForMission",
      "timelineLog",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const content = readFileSync(check.file, "utf8");

  for (const prop of check.bannedProperties) {
    const propertyPattern = new RegExp(`^\\s*${prop}\\s*:`, "m");
    if (propertyPattern.test(content)) {
      failures.push(`${check.label}: banned flat export/property reintroduced: ${prop}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Canonical API guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Canonical API guard passed.");
