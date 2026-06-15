import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRouter from "./ai.mjs";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use("/api/ai", aiRouter);

const PYTHON_API_BASE = process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:8000";

app.post("/api/profile/fetch", async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API_BASE}/api/v1/profile/fetch`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch profile",
      details: error.message,
    });
  }
});

app.post("/api/profile/save", async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API_BASE}/api/v1/profile/save`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: "Failed to save profile",
      details: error.message,
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[INOS Server] Running on http://localhost:${PORT}`);
});
