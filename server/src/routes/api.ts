import { Router, Request, Response } from 'express';
import fs from 'fs-extra';
import { cloneRepository } from '../services/github';
import { scanForEnvVariables, runSandboxedApp, EnvVarInfo } from '../services/docker';
import { analyzeRepository, extractEnvVarsUsingAI } from '../services/ai';
import { fetchAllGitHubData } from '../services/github-api';

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

export default router;
