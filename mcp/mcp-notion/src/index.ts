import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";
import { validateConfig, getConfig } from "./config.js";
import { PUBLIC_TOOL_NAMES, Tools } from "./tools.js";
import { VertexGeminiClient } from "./llmClient.js";
import { Logger, MCPError, ErrorCodes } from "./errors.js";
import twinProfilesRouter from "./routes/twin-profiles.js";
import entitiesRouter from "./routes/entities.js";
import coreRouter from "./routes/core.js";
import timelineRouter from "./routes/timeline.js";
import { contextStorage } from "./context.js";

const logger = new Logger("Server");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT", err);
});

async function main() {
  try {
    logger.info("Starting MCP Notion server (INOS_E0 integration)");
    validateConfig();
    const tools = new Tools();
    const config = getConfig();

    // --- MCP SERVER SETUP ---
    const server = new Server(
      { name: "mcp-notion", version: "0.1.1" },
      { capabilities: { tools: {} } }
    );

    // List Tools Handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolList = await tools.getToolDefinitions();
      return { tools: toolList };
    });

    // Call Tool Handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const actualName = name.replace("_", "."); const method = (tools as any)[actualName] || (tools as any)[name];
      if (!method) throw new Error(`Tool ${name} not found`);
      const result = await method.call(tools, args);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    });

    const app = express();
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") return res.sendStatus(204);
      next();
    });
    app.use(express.json());

    // --- MCP SSE ROUTES ---
    let transport: SSEServerTransport | null = null;

    app.get("/sse", async (req, res) => {
      logger.info("New SSE connection attempt");
      transport = new SSEServerTransport("/messages", res);
      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("No active SSE transport");
      }
    });

    // --- REST ROUTES ---
    app.use("/api/v1/twin-profiles", twinProfilesRouter);
    app.use("/tool", entitiesRouter);
    app.use("/tool", coreRouter);
    app.use("/tool", timelineRouter);

    app.get("/health", (req, res) => res.json({ ok: true, status: "operational", mcp: "sse_ready" }));

    const serverPort = Number(config.PORT) || 3002;
    app.listen(serverPort, "0.0.0.0", () => {
      logger.info(`Server ready on port ${serverPort} (SSE + REST)`);
    });

  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error("Unhandled error in main", error);
  process.exit(1);
});

