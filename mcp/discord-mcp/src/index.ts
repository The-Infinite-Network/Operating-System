import express, { Request, Response } from "express";
import { validateConfig, getConfig } from "./config.js";
import { Tools } from "./tools.js";
import { Logger, MCPError, ErrorCodes } from "./errors.js";

const logger = new Logger("Server");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED", err);
});

const TOOL_NAMES = [
  "discord.listGuilds",
  "discord.listChannels",
  "discord.readMessages",
  "discord.sendMessage",
];

async function main() {
  try {
    logger.info("Starting MCP Discord server (INOS_E0 integration)");

    validateConfig();
    logger.info("Configuration validated");

    const tools = new Tools();
    logger.info("Tools initialized");

    const app = express();
    const config = getConfig();

    app.use(express.json());

    // CORS middleware
    app.use((req: Request, res: Response, next) => {
      const allowedOrigins = config.CORS_ALLOWED_ORIGINS || [];
      const origin = req.headers.origin;
      const isDevelopment = config.NODE_ENV === "development";

      let allowOrigin = false;
      if (origin) {
        if (allowedOrigins.includes(origin)) {
          allowOrigin = true;
        } else if (
          isDevelopment &&
          (origin.startsWith("http://localhost:") ||
            origin.startsWith("http://127.0.0.1:"))
        ) {
          allowOrigin = true;
        }
      }

      if (allowOrigin && origin) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      if (req.method === "OPTIONS") return res.sendStatus(200);
      next();
    });

    // Health check
    app.get("/health", (_req: Request, res: Response) => {
      res.json({
        ok: true,
        service: "mcp-discord",
        version: "0.1.0",
        epoch: "INOS_E0",
        status: "operational",
        port: config.PORT,
        discordConfigured: !!process.env.DISCORD_TOKEN,
      });
    });

    // Tools registry
    app.get("/tools", (_req: Request, res: Response) => {
      res.json(TOOL_NAMES);
    });

    // Root
    app.get("/", (_req: Request, res: Response) => {
      res.json({
        service: "MCP Discord Server",
        version: "0.1.0",
        epoch: "INOS_E0",
        status: "operational",
        endpoints: {
          health: "GET /health",
          tools: "GET /tools",
          toolExecution: "POST /tool/:toolName",
        },
      });
    });

    // MCP Tool endpoint: POST /tool/{toolName}
    app.post("/tool/:toolName", async (req: Request, res: Response) => {
      const { toolName } = req.params;
      const { params } = req.body || {};
      const request_id = `tool_${toolName}_${Date.now().toString(36)}`;

      try {
        const method = (tools as any)[toolName];
        if (!method || typeof method !== "function") {
          return res.status(404).json({
            ok: false,
            request_id,
            error: {
              code: ErrorCodes.NOT_FOUND,
              message: `Tool '${toolName}' not found`,
              details: { toolName, available: TOOL_NAMES },
            },
          });
        }

        const data = await method.call(tools, params);
        res.json({ ok: true, request_id, data });
      } catch (error) {
        const mcpError =
          error instanceof MCPError
            ? error
            : new MCPError(ErrorCodes.INTERNAL_ERROR, String(error), { toolName });

        const response = mcpError.toResponse();
        res.status(mcpError.code === ErrorCodes.INTERNAL_ERROR ? 500 : 400).json({
          ok: false,
          request_id,
          error: {
            code: response.code,
            message: response.message,
            details: response.details,
          },
        });
      }
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        code: ErrorCodes.NOT_FOUND,
        message: "Endpoint not found",
        details: { path: req.path, method: req.method },
      });
    });

    const serverPort = config.PORT;
    const serverHost = "0.0.0.0";

    app.listen(serverPort, serverHost, () => {
      logger.info(`MCP Discord server listening on http://${serverHost}:${serverPort}`);
      logger.info(`Health check: GET http://${serverHost}:${serverPort}/health`);
      logger.info(`Tool endpoint: POST http://${serverHost}:${serverPort}/tool/{toolName}`);
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
