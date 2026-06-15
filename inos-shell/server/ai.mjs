import { Router } from "express";
import axios from "axios";

const router = Router();

const PYTHON_AI_SERVICE_URL =
  process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";

router.post("/generate", async (req, res) => {
  try {
    console.log("[AI Proxy] Forwarding generation request to Python service...");
    const response = await axios.post(
      `${PYTHON_AI_SERVICE_URL}/generate`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("[AI Proxy] Error calling Python service:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to communicate with AI service",
      details: error.message,
    });
  }
});

router.get("/status", async (_req, res) => {
  try {
    const response = await axios.get(`${PYTHON_AI_SERVICE_URL}/health`);
    res.json({
      server: "Node.js",
      python_service: response.data,
      status: "ok",
    });
  } catch (error) {
    res.json({
      server: "Node.js",
      python_service: "offline",
      status: "degraded",
      error: error.message,
    });
  }
});

export default router;
