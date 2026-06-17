const BASE_URL = process.env.MCP_BASE_URL || "http://localhost:3002";
const PAGE_ID = (process.env.FULCRUM_CAPABILITY_PAGE_ID || "").trim();
const EXPECTED_CURRENT_OWNER = (process.env.FULCRUM_EXPECTED_CURRENT_OWNER || "").trim();
const REQUESTED_OWNER = (process.env.FULCRUM_REQUESTED_OWNER || "FULCRUM").trim();

async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Invalid JSON from ${response.url}: ${text}`);
  }
}

async function readBody(response) {
  return response.text();
}

async function run() {
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await parseJson(healthRes);
    if (!healthRes.ok || !healthJson.ok) {
      throw new Error(`Health check failed: ${healthRes.status} ${JSON.stringify(healthJson)}`);
    }

    console.log("OK health", {
      ok: Boolean(healthJson.ok),
      status: healthJson.status || null,
      mcp: healthJson.mcp || null,
      request_id: healthJson.request_id || null,
      remediation_warnings: Array.isArray(healthJson.remediation_warnings)
        ? healthJson.remediation_warnings.length
        : null,
    });

    const schemaRes = await fetch(`${BASE_URL}/api/v1/fulcrum/capability-registry/schema`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (schemaRes.status === 404) {
      await readBody(schemaRes);
      throw new Error(
        "Capability Registry schema route is missing on the live runtime. Port 3002 is serving a stale mcp-notion process that predates the FULCRUM route patch."
      );
    }
    const schemaJson = await parseJson(schemaRes);
    if (!schemaRes.ok || !schemaJson.ok) {
      throw new Error(
        `Capability Registry schema failed: ${schemaRes.status} ${JSON.stringify(schemaJson)}`
      );
    }

    const schema = schemaJson.data || {};
    console.log("OK capability-registry.schema", {
      db_id: schema.db_id,
      owner_agent_property: schema.owner_agent_property?.name || null,
      owner_agent_type: schema.owner_agent_property?.type || null,
      fulcrum_supported: Boolean(schema.fulcrum_supported),
      option_count: Array.isArray(schema.owner_agent_property?.options)
        ? schema.owner_agent_property.options.length
        : 0,
    });

    if (!PAGE_ID) {
      console.log("SKIP capability-registry.owner-agent", {
        reason: "FULCRUM_CAPABILITY_PAGE_ID not set",
      });
      process.exit(0);
    }

    const ownerPayload = {
      pageId: PAGE_ID,
      newOwnerAgent: REQUESTED_OWNER,
      dryRun: true,
    };

    if (EXPECTED_CURRENT_OWNER) {
      ownerPayload.expectedCurrentOwner = EXPECTED_CURRENT_OWNER;
    }

    const ownerRes = await fetch(`${BASE_URL}/api/v1/fulcrum/capability-registry/owner-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ownerPayload),
    });
    const ownerJson = await parseJson(ownerRes);
    if (!ownerRes.ok || !ownerJson.ok) {
      throw new Error(
        `Capability Registry owner-agent dry run failed: ${ownerRes.status} ${JSON.stringify(ownerJson)}`
      );
    }

    const result = ownerJson.data || {};
    console.log("OK capability-registry.owner-agent", {
      page_id: result.page_id,
      current_owner_agent: result.current_owner_agent,
      requested_owner_agent: result.requested_owner_agent,
      supported: Boolean(result.supported),
      ready: Boolean(result.ready),
      blocked: Boolean(result.blocked),
      updated: Boolean(result.updated),
      reason: result.reason || null,
      dry_run: Boolean(result.dry_run),
    });

    process.exit(0);
  } catch (error) {
    console.error("FAIL", error.message || error);
    process.exit(1);
  }
}

run();
