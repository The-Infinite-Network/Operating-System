import express from "express";
import multer from "multer";
import { buildFulcrumEnvelope } from "./fulcrumShared.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Compatibility alias: preserve the old Twin intake path while routing to FULCRUM.
router.post("/intake", upload.single("document"), async (req, res) => {
  const file = req.file;
  const intakeMode = file
    ? "document"
    : req.body?.raw_answers
      ? "questionnaire"
      : req.body?.document_content
        ? "document"
        : "direct_request";

  res.json({
    ok: true,
    data: {
      intake_id: `FULCRUM-ALIAS-${Date.now()}`,
      intake_mode: intakeMode,
      status: "candidate",
      compatibility_alias: "twin_profiles_intake",
      ...buildFulcrumEnvelope("compatibility_alias"),
    },
  });
});

export default router;
