import express, { Request, Response } from "express";
import { validateConfig, getConfig } from "./config.js";
import { Tools, TOOL_NAMES } from "./tools.js";
import { Logger, MCPError, ErrorCodes } from "./errors.js";

const logger = new Logger("Server");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED", err);
});

async function main() {
  try {
    logger.info("Starting mcp-todo server (INOS_E0 integration)");

    validateConfig();
    logger.info("Configuration validated");

    const tools = new Tools();
    const app = express();
    const config = getConfig();

    app.use(express.json());

    // CORS
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
          (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))
        ) {
          allowOrigin = true;
        }
      }

      if (allowOrigin && origin) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
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
        service: "mcp-todo",
        version: "0.1.0",
        epoch: "INOS_E0",
        status: "operational",
        port: config.PORT,
        auth: config.MS_TODO_ACCESS_TOKEN ? "access_token" : "client_credentials",
      });
    });

    // Tools registry
    app.get("/tools", (_req: Request, res: Response) => {
      res.json(TOOL_NAMES);
    });

    // Root
    app.get("/", (_req: Request, res: Response) => {
      res.json({
        service: "mcp-todo",
        version: "0.1.0",
        epoch: "INOS_E0",
        endpoints: {
          health: "GET /health",
          tools: "GET /tools",
          toolExecution: "POST /tool/:toolName",
        },
      });
    });

    // POST /tool/:toolName
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
              code: ErrorCodes.BAD_REQUEST,
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
          error: { code: response.code, message: response.message, details: response.details },
        });
      }
    });

    // 404
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        code: ErrorCodes.NOT_FOUND,
        message: "Endpoint not found",
        details: { path: req.path, method: req.method },
      });
    });

    const serverPort = Number(process.env.PORT) || 3004;
    app.listen(serverPort, "0.0.0.0", () => {
      logger.info(`mcp-todo listening on http://0.0.0.0:${serverPort}`);
      logger.info(`Health: GET http://0.0.0.0:${serverPort}/health`);
      logger.info(`Tool:   POST http://0.0.0.0:${serverPort}/tool/{toolName}`);
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
