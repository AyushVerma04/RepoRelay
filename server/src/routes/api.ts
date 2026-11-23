import { Router, Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import mongoose from 'mongoose';
import { cloneRepository, WORKSPACES_DIR } from '../services/github';
import { scanForEnvVariables, runSandboxedApp, EnvVarInfo } from '../services/docker';
import { analyzeRepository, extractEnvVarsUsingAI, generateSecurityAnalysis } from '../services/ai';
import { fetchAllGitHubData } from '../services/github-api';
import SearchHistory from '../models/SearchHistory';
import { User } from '../models/User';

const router = Router();

router.post('/analyze', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  try {
    // 1. Clone repository
    const { repoDir, runId } = await cloneRepository(repoUrl);

    // 2. Run everything in parallel for speed
    const [summary, staticEnvVars, aiSecretKeys, githubData] = await Promise.all([
      analyzeRepository(repoDir),
      scanForEnvVariables(repoDir),
      extractEnvVarsUsingAI(repoDir),
      fetchAllGitHubData(repoUrl, repoDir),
    ]);

    // 3. Merge env vars — AI can upgrade a key's isSecret flag if static scan missed it
    const seenKeys = new Set(staticEnvVars.map(v => v.key));
    const envVars: EnvVarInfo[] = [...staticEnvVars];

    for (const key of aiSecretKeys) {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        envVars.push({ key, defaultValue: '', isSecret: true });
      } else {
        // AI says it's a secret — upgrade the existing entry
        const existing = envVars.find(v => v.key === key);
        if (existing && !existing.isSecret) {
          existing.isSecret = true;
          existing.defaultValue = ''; // clear pre-fill so user must enter it
        }
      }
    }

    // 4. Save to history if user is authenticated and DB is connected
    const userId = req.body.userId;
    if (userId && mongoose.connection.readyState === 1) {
      try {
        const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || repoUrl;
        await SearchHistory.create({ userId, repoUrl, repoName, searchedAt: new Date() });
      } catch (historyErr) {
        console.warn('Failed to save search history:', historyErr);
      }
    }

    res.json({
      runId,
      summary,
      envVars,
      repoMeta: githubData.repoMeta,
      ownerProfile: githubData.ownerProfile,
      ownerRepos: githubData.ownerRepos,
      languages: githubData.languages,
      contributors: githubData.contributors,
      recentCommits: githubData.recentCommits,
      directoryTree: githubData.directoryTree,
    });
  } catch (error: any) {
    console.error('Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * Scan environment variables endpoint - shows what env vars are needed
 */
router.post('/scan-env', async (req: Request, res: Response) => {
  const { repoDir } = req.body;

  if (!repoDir) {
    return res.status(400).json({ error: 'repoDir is required' });
  }

  try {
    const requiredEnvVars = await scanForEnvVariables(repoDir);
    
    const secretVars = requiredEnvVars.filter(v => v.isSecret);
    const configVars = requiredEnvVars.filter(v => !v.isSecret);

    res.json({
      success: true,
      totalVars: requiredEnvVars.length,
      secretVars,
      configVars,
      message: secretVars.length > 0 
        ? `Found ${secretVars.length} required secrets and ${configVars.length} config vars`
        : `Found ${configVars.length} config vars`,
    });
  } catch (error: any) {
    console.error('Scan Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Scan failed',
    });
  }
});

/**
 * Deploy endpoint: takes cloned repoDir and envVars, deploys to Docker
 */
router.post('/deploy', async (req: Request, res: Response) => {
  const { repoDir, envVars } = req.body;

  if (!repoDir) {
    return res.status(400).json({ error: 'repoDir is required' });
  }

  const logs: string[] = [];
  
  try {
    // First, scan for required env variables
    const requiredEnvVars = await scanForEnvVariables(repoDir);
    
    // Check for missing secrets
    const secretVars = requiredEnvVars.filter(v => v.isSecret);
    const missingSecrets = secretVars.filter(v => !envVars?.[v.key] || !envVars[v.key].trim());
    
    if (missingSecrets.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required environment variables: ${missingSecrets.map(v => v.key).join(', ')}`,
        missingVars: missingSecrets,
        requiredEnvVars: secretVars,
      });
    }

    // CREATE .env FILE IN BACKEND/SERVER DIRECTORY
    const backendDirs = ['backend', 'server'];
    let envFileCreated = false;
    
    for (const backendDir of backendDirs) {
      const backendPath = `${repoDir}/${backendDir}`;
      const envPath = `${backendPath}/.env`;
      
      if (await fs.pathExists(backendPath)) {
        // Build .env file content from all detected and provided vars
        const envContent = requiredEnvVars
          .map(v => `${v.key}=${envVars?.[v.key] || v.defaultValue || ''}`)
          .join('\n');
        
        await fs.writeFile(envPath, envContent, 'utf-8');
        console.log(`✅ Created ${envPath}`);
        envFileCreated = true;
        logs.push(`Created .env file in ${backendDir} directory with ${requiredEnvVars.length} variables\n`);
        break;
      }
    }
    
    // If no backend/server dir, create .env at root
    if (!envFileCreated) {
      const envPath = `${repoDir}/.env`;
      const envContent = requiredEnvVars
        .map(v => `${v.key}=${envVars?.[v.key] || v.defaultValue || ''}`)
        .join('\n');
      await fs.writeFile(envPath, envContent, 'utf-8');
      logs.push(`Created .env file at root with ${requiredEnvVars.length} variables\n`);
    }

    // Generate a unique image name based on timestamp
    const imageName = `app-sandbox-${Date.now()}`;
    
    // Track logs sent to client
    const onLog = (msg: string) => {
      logs.push(msg);
      console.log(msg);
    };

    // Run the sandboxed app (clone → scan env → build → run)
    const result = await runSandboxedApp(repoDir, imageName, envVars || {}, onLog);

    res.json({
      success: true,
      hostPort: result.hostPort,
      containerId: result.containerId,
      requiredEnvVars: result.requiredEnvVars,
      logs: logs.join(''),
      message: `Application deployed successfully on port ${result.hostPort}`,
    });
  } catch (error: any) {
    console.error('Deploy Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed',
      logs: logs.join('') || '',
    });
  }
});

/**
 * Fetch Search History for a specific user
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const history = await SearchHistory.find({ userId }).sort({ searchedAt: -1 }).limit(20);
    res.json(history);
  } catch (err: any) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * Fetch user profile info
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ name: 'RepoRelay Agent', email: 'agent@reporelay.internal', createdAt: new Date() });
    }
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    console.error('User fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * Security Threat Model Analysis
 */
router.post('/security', async (req: Request, res: Response) => {
  const { runId } = req.body;
  try {
    let repoDir: string | undefined;
    if (runId) {
      const candidateDir = path.join(WORKSPACES_DIR, runId);
      if (await fs.pathExists(candidateDir)) {
        repoDir = candidateDir;
      }
    }
    const securityData = await generateSecurityAnalysis(repoDir);
    res.json(securityData);
  } catch (err: any) {
    console.error('Security analysis error:', err);
    res.status(500).json({ error: 'Failed to generate security model' });
  }
});

export default router;
