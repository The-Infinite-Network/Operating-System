#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.MCP_NOTION_PORT || "3002";
const BASE_URL = `http://localhost:${PORT}`;
const TOOL_TIMEOUT_MS = Number(process.env.MCP_NOTION_HTTP_TIMEOUT_MS || 30000);
const STARTUP_TIMEOUT_MS = Number(
  process.env.MCP_NOTION_STARTUP_TIMEOUT_MS || 20000
);
const HEALTH_POLL_INTERVAL_MS = Number(
  process.env.MCP_NOTION_HEALTH_POLL_INTERVAL_MS || 750
);
const AUTO_START_BACKEND = process.env.MCP_NOTION_AUTO_START !== "0";
const BACKEND_ENTRYPOINT = path.join(__dirname, "dist", "index.js");

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function httpGet(path) {
  const response = await fetch(`${normalizeBaseUrl(BASE_URL)}${path}`);
  const body = await readJson(response);
  return { status: response.status, body };
}

async function httpPost(path, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOOL_TIMEOUT_MS);

  try {
    const response = await fetch(`${normalizeBaseUrl(BASE_URL)}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await readJson(response);
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function formatResult(result) {
  if (typeof result === "string") {
    return result;
  }

  return JSON.stringify(result, null, 2);
}

function getErrorMessage(toolName, status, body) {
  const message =
    body?.error?.message ||
    body?.message ||
    (typeof body === "string" ? body : "") ||
    `Tool '${toolName}' failed`;

  if (status && status >= 400) {
    return `HTTP ${status}: ${message}`;
  }

  return message;
}

async function loadToolNames() {
  const { status, body } = await httpGet("/tools");

  if (status !== 200 || !Array.isArray(body)) {
    throw new Error(
      `Failed to load tools from ${BASE_URL}/tools (status ${status})`
    );
  }

  return [...new Set(body.filter((name) => typeof name === "string" && name.trim()))];
}

async function fetchHealthStatus() {
  try {
    const { status, body } = await httpGet("/health");
    return { ok: status === 200, status, body, error: null };
  } catch (error) {
    return { ok: false, status: 0, body: null, error };
  }
}

function canAutostartBackend() {
  return AUTO_START_BACKEND && fs.existsSync(BACKEND_ENTRYPOINT);
}

function startBackend() {
  const child = spawn(process.execPath, [BACKEND_ENTRYPOINT], {
    cwd: __dirname,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      PORT,
    },
  });

  child.unref();
}

async function ensureBackendReady() {
  let health = await fetchHealthStatus();
  if (health.ok) {
    return;
  }

  if (canAutostartBackend()) {
    process.stderr.write(
      `[mcp-notion-stdio] Backend not reachable at ${BASE_URL}. Auto-starting dist/index.js.\n`
    );
    startBackend();
  } else {
    process.stderr.write(
      `[mcp-notion-stdio] WARNING: backend not reachable at ${BASE_URL} and auto-start is unavailable.\n`
    );
    if (!AUTO_START_BACKEND) {
      process.stderr.write(
        "[mcp-notion-stdio] Auto-start disabled via MCP_NOTION_AUTO_START=0.\n"
      );
    } else {
      process.stderr.write(
        `[mcp-notion-stdio] Missing backend entrypoint: ${BACKEND_ENTRYPOINT}\n`
      );
    }
  }

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(HEALTH_POLL_INTERVAL_MS);
    health = await fetchHealthStatus();
    if (health.ok) {
      process.stderr.write(
        `[mcp-notion-stdio] Backend healthy at ${BASE_URL}.\n`
      );
      return;
    }
  }

  const statusNote = health.status ? `status ${health.status}` : "no response";
  const errorNote =
    health.error instanceof Error && health.error.message
      ? ` (${health.error.message})`
      : "";

  throw new Error(
    `mcp-notion backend did not become ready at ${BASE_URL}/health within ${STARTUP_TIMEOUT_MS}ms (${statusNote}${errorNote})`
  );
}

async function main() {
  await ensureBackendReady();

  const toolNames = await loadToolNames();

  const server = new McpServer({
    name: "mcp-notion-stdio",
    version: "1.0.0",
  });

  for (const toolName of toolNames) {
    server.registerTool(
      toolName,
      {
        description: `Invoke mcp-notion HTTP tool '${toolName}'`,
        inputSchema: z.object({}).passthrough(),
      },
      async (args) => {
        let status;
        let body;

        try {
          ({ status, body } = await httpPost(`/tool/${toolName}`, { params: args || {} }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(`HTTP error calling '${toolName}': ${message}`);
        }

        if (status >= 400 || body?.ok === false) {
          throw new Error(getErrorMessage(toolName, status, body));
        }

        const result = body?.data ?? body;

        return {
          content: [
            {
              type: "text",
              text: formatResult(result),
            },
          ],
        };
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write(
    `[mcp-notion-stdio] Connected over stdio. Bridging ${toolNames.length} tools to ${BASE_URL}.\n`
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`[mcp-notion-stdio] FATAL: ${message}\n`);
  process.exit(1);
});
