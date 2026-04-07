import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs-extra';
import mongoose from 'mongoose';
import { WebSocketServer, WebSocket } from 'ws';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import { runSandboxedApp } from './services/docker';
import path from 'path';
import { WORKSPACES_DIR } from './services/github';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main REST routes
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GitHub Sandboxed Execution Agent API is running.' });
});

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('[Startup] Connected to MongoDB via process.env.MONGO_URI');
  }).catch(err => {
    console.error('[Startup] Failed to connect to MongoDB:', err);
  });
}


const server = http.createServer(app);

// WebSocket setup for streaming Docker execution logs
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (message: Buffer | string) => {
    try {
      const payload = JSON.parse(message.toString());
      
      if (payload.type === 'deploy') {
        const { runId, envVars } = payload;
        const repoDir = path.join(WORKSPACES_DIR, runId);
        const imageName = `sandbox-${runId}`;

        const logDispatcher = (msg: string) => {
          ws.send(JSON.stringify({ type: 'log', message: msg }));
        };

        try {
          // Note: requiredEnvVars is returned now, but we don't need it for the success signal
          const { hostPort, containerId } = await runSandboxedApp(repoDir, imageName, envVars, logDispatcher);
          const url = `http://localhost:${hostPort}`;
          ws.send(JSON.stringify({ type: 'success', url, hostPort, containerId }));
        } catch (dockerErr: any) {
          logDispatcher(`\n[ERROR] Docker Execution Failed: ${dockerErr.message}\n`);
          ws.send(JSON.stringify({ type: 'error', message: dockerErr.message }));
        }
      }
    } catch (parseError) {
      console.error('WS parse error:', parseError);
    }
  });
  
  ws.send(JSON.stringify({ type: 'log', message: 'Execution Engine Online. Awaiting deployment manifest...' }));
});

/**
 * Purge workspace directories older than 1 hour on startup.
 * Prevents EBUSY accumulation across dev sessions on Windows.
 */
async function cleanupStaleWorkspaces() {
  try {
    await fs.ensureDir(WORKSPACES_DIR);
    const entries = await fs.readdir(WORKSPACES_DIR);
    const now = Date.now();
    let cleaned = 0;
    for (const entry of entries) {
      try {
        const fullPath = path.join(WORKSPACES_DIR, entry);
        const stat = await fs.stat(fullPath);
        if (now - stat.mtimeMs > 60 * 60 * 1000) {
          await fs.remove(fullPath);
          cleaned++;
        }
      } catch { /* ignore per-entry errors */ }
    }
    if (cleaned > 0) console.log(`[Startup] Cleaned ${cleaned} stale workspace(s).`);
  } catch { /* ignore if workspaces dir doesn't exist yet */ }
}

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await cleanupStaleWorkspaces();
});
