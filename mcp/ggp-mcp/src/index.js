import express from "express";
import { validateConfig, getConfig } from "./config.js";
import { Tools } from "./tools.js";
import { Logger, MCPError, ErrorCodes } from "./errors.js";

const logger = new Logger("GGP-MCP");

async function main() {
  try {
    validateConfig();
    const config = getConfig();

    const app = express();
    app.use(express.json());

    app.get("/health", (req, res) => {
      res.json({
        ok: true,
        service: "ggp-mcp",
        version: "0.1.0",
        status: "operational",
        port: config.PORT,
      });
    });

    app.get("/tools", (req, res) => {
      res.json([
        "get_daily_snapshot",
        "audit_cash_log",
        "query_roster",
        "submit_incident_report",
      ]);
    });

    app.post("/tool/:toolName", async (req, res) => {
      const { toolName } = req.params;
      const { params } = req.body || {};

      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace(/^Bearer\s+/i, "");
        const tools = new Tools(token);

        const userContext = {
          userHandle: req.headers["x-user-handle"] || params?.userHandle,
          userName: req.headers["x-user-name"] || params?.userName,
          userId: req.headers["x-user-id"] || params?.userId,
        };

        const enrichedParams = {
          ...params,
          userContext: Object.values(userContext).some(Boolean)
            ? userContext
            : undefined,
        };

        const method = tools[toolName];
        if (!method) {
          return res.status(404).json({
            ok: false,
            error: {
              code: ErrorCodes.BAD_REQUEST,
              message: `Tool '${toolName}' not found`,
              details: { toolName },
            },
          });
        }

        const data = await method.call(tools, enrichedParams);
        res.json({ ok: true, data });
      } catch (error) {
        const mcpError =
          error instanceof MCPError
            ? error
            : new MCPError(ErrorCodes.INTERNAL_ERROR, String(error), {
                toolName,
              });

        const response = mcpError.toResponse();
        res
          .status(mcpError.code === ErrorCodes.INTERNAL_ERROR ? 500 : 400)
          .json({ ok: false, error: response });
      }
    });

    app.use((req, res) => {
      res.status(404).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Endpoint not found",
        details: { path: req.path, method: req.method },
      });
    });

    app.listen(config.PORT, "0.0.0.0", () => {
      logger.info(`GGP MCP server listening on http://0.0.0.0:${config.PORT}`);
      logger.info(`Health check: GET /health`);
      logger.info(`Tool endpoint: POST /tool/{toolName}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

main();
