import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRouter from './ai.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/ai', aiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[INOS Server] Running on http://localhost:${PORT}`);
});
