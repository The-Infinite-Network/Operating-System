import { Tools } from "../tools.js";

type ToolRun = {
  name: string;
  params: unknown;
};

function getEnvOrPlaceholder(key: string, placeholder: string) {
  return process.env[key] && process.env[key] !== ""
    ? process.env[key]
    : placeholder;
}

async function runSmokeTests() {
  const tools = new Tools();

  const toolRuns: ToolRun[] = [
    { name: "databases.list", params: {} },
    {
      name: "pages.get",
      params: {
        pageId: getEnvOrPlaceholder(
          "NOTION_SMOKE_PAGE_ID",
          "placeholder-page-id"
        ),
      },
    },
    {
      name: "missions.upsert",
      params: {
        missionData: {
          title: "Smoke Test Mission",
          status: "Planning",
        },
        existingPageId:
          process.env.NOTION_SMOKE_EXISTING_PAGE_ID &&
          process.env.NOTION_SMOKE_EXISTING_PAGE_ID !== ""
            ? process.env.NOTION_SMOKE_EXISTING_PAGE_ID
            : undefined,
      },
    },
    {
      name: "missionsTasksList",
      params: {
        missionId: getEnvOrPlaceholder(
          "NOTION_SMOKE_MISSION_ID",
          "placeholder-mission-id"
        ),
      },
    },
    {
      name: "ark.sealLog",
      params: {
        assetId: `smoke-asset-${Date.now()}`,
        assetTitle: "Smoke Asset",
        missionId:
          process.env.NOTION_SMOKE_MISSION_ID &&
          process.env.NOTION_SMOKE_MISSION_ID !== ""
            ? process.env.NOTION_SMOKE_MISSION_ID
            : undefined,
        notes: "Smoke test run",
      },
    },
    {
      name: "inbox.capture",
      params: {
        title: "Smoke Inbox Item",
        source: "mcp-smoke",
        type: "info",
        notes: "Smoke test run",
      },
    },
  ];

  if (process.env.NOTION_DB_TIMELINE) {
    toolRuns.push(
      {
        name: "timeline.log",
        params: {
          title: `Smoke Timeline ${Date.now()}`,
          type: "smoke",
          source: "mcp-smoke",
          notes: "Timeline smoke test run",
        },
      },
      {
        name: "timeline.list",
        params: { limit: 3 },
      }
    );
  } else {
    console.log("SKIP timeline tools (NOTION_DB_TIMELINE not set)");
  }

  let allPassed = true;

  for (const { name, params } of toolRuns) {
    const method = (tools as any)[name];
    if (typeof method !== "function") {
      console.error(`❌ ${name}: tool not found on Tools class`);
      allPassed = false;
      continue;
    }

    try {
      await method.call(tools, params);
      console.log(`✅ ${name}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`❌ ${name}: ${message}`);
      allPassed = false;
    }
  }

  process.exit(allPassed ? 0 : 1);
}

runSmokeTests().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ mcp_smoke_all failed to start: ${message}`);
  process.exit(1);
});
