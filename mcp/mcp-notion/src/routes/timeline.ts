import { Router } from "express";
import { Tools } from "../tools.js";
import { MCPError } from "../errors.js";

const router = Router();
const tools = new Tools();

function handleError(res: any, error: unknown) {
  if (error instanceof MCPError) {
    return res.status(400).json(error.toResponse());
  }
  return res.status(500).json({ code: "INTERNAL_ERROR", message: String(error) });
}

router.post("/timeline.list", async (req, res) => {
  try {
    const result = await tools["timeline.list"](req.body.params || {});
    res.json({ data: result });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/timeline.log", async (req, res) => {
  try {
    const result = await tools["timeline.log"](req.body.params || {});
    res.json({ data: result });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/timeline.logEvent", async (req, res) => {
  try {
    const result = await tools["timeline.logEvent"](req.body.params || {});
    res.json({ data: result });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/timeline.queryByMission", async (req, res) => {
  try {
    const result = await tools["timeline.queryByMission"](req.body.params || {});
    res.json({ data: result });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
