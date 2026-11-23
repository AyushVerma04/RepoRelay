import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import dns from 'dns';
import fs from 'fs-extra';
import mongoose from 'mongoose';
import { WebSocketServer, WebSocket } from 'ws';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import { runSandboxedApp } from './services/docker';
import path from 'path';
import { WORKSPACES_DIR } from './services/github';

// Ensure DNS SRV queries resolve reliably on cloud container networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting localhost, Vercel deployments (*.vercel.app), and custom client origins
app.use(cors({
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback to prevent initial deploy blocks
  },
  credentials: true,
}));
app.use(express.json());

// Root welcome & discovery route for health probes and browsers
app.get('/', (req: any, res: any) => {
  res.json({
    status: 'ok',
    service: 'RepoRelay Execution Engine API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze',
      auth: '/api/auth',
      ws: '/ws',
    }
  });
});

// Health check endpoints (compatible with Render, Railway, uptime monitors)
app.get(['/health', '/api/health'], (req: any, res: any) => {
  res.json({
    status: 'ok',
    message: 'GitHub Sandboxed Execution Agent API is running.',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongoConfigured: !!process.env.MONGO_URI,
    uptime: process.uptime(),
  });
});

// Main REST routes
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);

// Connect to MongoDB with auto-retry
async function connectMongoWithRetry() {
  if (!process.env.MONGO_URI) {
    console.warn('[Startup] No MONGO_URI provided in environment variables.');
    return;
  }
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Startup] Connected to MongoDB via process.env.MONGO_URI');
  } catch (err: any) {
    console.error('[Startup] Failed to connect to MongoDB, retrying in 5s...', err.message);
    setTimeout(connectMongoWithRetry, 5000);
  }
}

connectMongoWithRetry();

// ─────────────────────────────────────────────────────────────────────────────
// WORKSPACE PREVIEW ENGINE (Serves deployed sandboxed apps without Docker)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/preview/:runId', async (req: any, res: any) => {
  const { runId } = req.params;
  const repoDir = path.join(WORKSPACES_DIR, runId);
  if (!(await fs.pathExists(repoDir))) {
    return res.status(404).send('Workspace preview not found or expired.');
  }

  // Look for index.html in common build or source locations
  const candidates = [
    'index.html',
    'dist/index.html',
    'build/index.html',
    'client/dist/index.html',
    'client/build/index.html',
    'client/index.html',
    'public/index.html',
    'frontend/index.html',
  ];

  for (const rel of candidates) {
    const full = path.join(repoDir, rel);
    if (await fs.pathExists(full)) {
      if (rel === 'index.html') {
        return res.sendFile(full);
      }
      return res.redirect(`/preview/${runId}/${rel.replace(/\/index\.html$/, '')}`);
    }
  }

  res.redirect(`/preview/${runId}/`);
});

// Serve static assets for the workspaces (css, js, images, html)
app.use('/preview', express.static(WORKSPACES_DIR, {
  dotfiles: 'allow',
  index: ['index.html', 'index.htm'],
}));

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
          const result = await runSandboxedApp(repoDir, imageName, envVars, logDispatcher);
          
          let url = '';
          if (result.containerId.startsWith('cloud-')) {
            const hostUrl = process.env.RENDER_EXTERNAL_URL || (process.env.PORT ? 'https://reporelay.onrender.com' : `http://localhost:${PORT}`);
            const baseOrigin = hostUrl.startsWith('http') ? hostUrl : `https://${hostUrl}`;
            url = `${baseOrigin}/preview/${runId}`;
          } else {
            url = `http://localhost:${result.hostPort}`;
          }

          logDispatcher(`\n🎉 Live Deployment Manifest Generated: ${url}\n`);
          ws.send(JSON.stringify({ type: 'success', url, hostPort: result.hostPort, containerId: result.containerId }));
        } catch (execErr: any) {
          logDispatcher(`\n[ERROR] Execution Failed: ${execErr.message}\n`);
          ws.send(JSON.stringify({ type: 'error', message: execErr.message }));
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
