const BASE_URL = process.env.MCP_BASE_URL || "http://localhost:3002";

async function run() {
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    if (!healthRes.ok || !health.ok) {
      throw new Error(`Health check failed: ${healthRes.status}`);
    }
    console.log("OK health", {
      service: health.service,
      auth_mode: health.llm?.auth_mode_resolved,
      model: health.llm?.model,
      request_id: health.request_id,
    });

    const toolRes = await fetch(`${BASE_URL}/tool/timeline.list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params: { limit: 5 } }),
    });
    const toolJson = await toolRes.json();
    if (!toolRes.ok) {
      throw new Error(`timeline.list failed: ${toolRes.status} ${JSON.stringify(toolJson)}`);
    }

    const data = toolJson.data || {};
    const events = data.events || [];
    console.log("OK timeline.list", {
      request_id: data.request_id || toolJson.request_id,
      count: events.length,
    });

    process.exit(0);
  } catch (err) {
    console.error("FAIL", err.message || err);
    process.exit(1);
  }
}

run();
