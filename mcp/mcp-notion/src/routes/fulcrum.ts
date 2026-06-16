import { Router } from "express";
import { buildFulcrumEnvelope } from "./fulcrumShared.js";
import { NotionClient } from "../client.js";
import { MCPError, ErrorCodes } from "../errors.js";

const router = Router();
const notion = new NotionClient();

router.post("/fulcrum/intake", async (req, res) => {
  const intakeMode = req.body?.raw_dialogue
    ? "dialogue"
    : req.body?.document_content || req.body?.source_url
      ? "document"
      : "direct_request";

  res.json({
    ok: true,
    data: {
      intake_id: `FULCRUM-${Date.now()}`,
      intake_mode: intakeMode,
      status: "candidate",
      ...buildFulcrumEnvelope("fulcrum_intake"),
    },
  });
});

router.post("/fulcrum/coordinate", async (_req, res) => {
  res.json({
    ok: true,
    data: buildFulcrumEnvelope("coordinate_stub"),
  });
});

router.post("/fulcrum/artifact-check", async (_req, res) => {
  const envelope = buildFulcrumEnvelope("artifact_check_stub");
  res.json({
    ok: true,
    data: {
      artifact_check: envelope.artifact_check,
      review_promotion_gate: envelope.review_promotion_gate,
      json_state: envelope.json_state,
    },
  });
});

router.post("/fulcrum/next-move", async (_req, res) => {
  const envelope = buildFulcrumEnvelope("next_move_stub");
  res.json({
    ok: true,
    data: {
      current_coordinate: envelope.current_coordinate,
      diagnosis: envelope.diagnosis,
      next_move: envelope.next_move,
      routing: envelope.routing,
      json_state: envelope.json_state,
    },
  });
});

router.post("/fulcrum/bundle", async (_req, res) => {
  const envelope = buildFulcrumEnvelope("bundle_stub");
  res.json({
    ok: true,
    data: {
      bundle_status: "candidate",
      bundle_targets: ["ARK candidate", "Timeline candidate", "Slack handoff"],
      review_promotion_gate: envelope.review_promotion_gate,
      routing: envelope.routing,
      json_state: envelope.json_state,
    },
  });
});

router.post("/fulcrum/capability-registry/schema", async (_req, res) => {
  try {
    const schema = await notion.getCapabilityRegistrySchema();
    res.json({
      ok: true,
      data: schema,
    });
  } catch (error) {
    const status =
      error instanceof MCPError && error.code === ErrorCodes.CONFIG_ERROR ? 400 : 500;
    res.status(status).json({
      ok: false,
      error: {
        code: error instanceof MCPError ? error.code : ErrorCodes.INTERNAL_ERROR,
        message:
          error instanceof Error
            ? error.message
            : "Capability Registry schema inspection failed",
      },
    });
  }
});

router.post("/fulcrum/capability-registry/owner-agent", async (req, res) => {
  try {
    const pageId = String(req.body?.pageId || "").trim();
    const newOwnerAgent = String(req.body?.newOwnerAgent || "").trim();
    const expectedCurrentOwner =
      req.body?.expectedCurrentOwner === undefined
        ? undefined
        : String(req.body.expectedCurrentOwner).trim();
    const dryRun = req.body?.dryRun !== false;

    if (!pageId || !newOwnerAgent) {
      return res.status(400).json({
        ok: false,
        error: {
          code: ErrorCodes.BAD_REQUEST,
          message: "pageId and newOwnerAgent are required",
        },
      });
    }

    const result = await notion.updateCapabilityRegistryOwnerAgent({
      pageId,
      newOwnerAgent,
      expectedCurrentOwner,
      dryRun,
    });

    res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const status =
      error instanceof MCPError &&
      (error.code === ErrorCodes.BAD_REQUEST || error.code === ErrorCodes.CONFIG_ERROR)
        ? 400
        : 500;

    res.status(status).json({
      ok: false,
      error: {
        code: error instanceof MCPError ? error.code : ErrorCodes.INTERNAL_ERROR,
        message:
          error instanceof Error
            ? error.message
            : "Capability Registry owner-agent mutation failed",
      },
    });
  }
});

export default router;
