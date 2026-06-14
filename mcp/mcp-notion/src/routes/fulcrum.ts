import { Router } from "express";
import { buildFulcrumEnvelope } from "./fulcrumShared.js";

const router = Router();

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

export default router;
