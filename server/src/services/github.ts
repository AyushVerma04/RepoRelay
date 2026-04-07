import { simpleGit, SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const WORKSPACES_DIR = path.join(__dirname, '..', '..', 'workspaces');

/**
 * Clones a repository into a unique workspace directory.
 */
export async function cloneRepository(repoUrl: string): Promise<{ repoDir: string; runId: string }> {
  const runId = uuidv4();
  const repoDir = path.join(WORKSPACES_DIR, runId);
  
  await fs.ensureDir(repoDir);
  
  const git: SimpleGit = simpleGit();
  try {
    await git.clone(repoUrl, repoDir, ['--depth', '20']); // shallow clone for speed, but enough for recent commits chart
    return { repoDir, runId };
  } catch (err: any) {
    // Best-effort cleanup — Windows may EBUSY lock .git files; don't let cleanup failure mask the real error
    try { await fs.remove(repoDir); } catch { /* ignore cleanup errors */ }
    throw new Error(`Failed to clone repository: ${err.message}`);
  }
}
