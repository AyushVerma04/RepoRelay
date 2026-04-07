import Groq from 'groq-sdk';
import fs from 'fs-extra';
import path from 'path';

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/**
 * Gather deep context from the repository for AI analysis.
 */
async function gatherRepoContext(repoDir: string): Promise<{
  directoryStructure: string;
  packageJsonStr: string;
  readmeStr: string;
  subPackages: string;
}> {
  // Directory structure
  const folders = await fs.readdir(repoDir);
  const directoryStructure = folders.filter(f => !f.startsWith('.git')).join(', ');

  // Root package.json
  let packageJsonStr = '';
  const pkgPath = path.join(repoDir, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      packageJsonStr = `Root package.json — Dependencies: ${JSON.stringify(pkg.dependencies || {})}, DevDeps: ${JSON.stringify(pkg.devDependencies || {})}, Scripts: ${JSON.stringify(pkg.scripts || {})}`;
    } catch {}
  }

  // Sub-folder package.jsons (client, server, frontend, backend)
  let subPackages = '';
  for (const sub of ['client', 'server', 'frontend', 'backend']) {
    const subPkg = path.join(repoDir, sub, 'package.json');
    if (await fs.pathExists(subPkg)) {
      try {
        const pkg = await fs.readJson(subPkg);
        subPackages += `\n${sub}/package.json — Deps: ${JSON.stringify(pkg.dependencies || {})}, Scripts: ${JSON.stringify(pkg.scripts || {})}`;
      } catch {}
    }
  }

  // README
  let readmeStr = '';
  const readmePath = path.join(repoDir, 'README.md');
  if (await fs.pathExists(readmePath)) {
    try {
      const content = await fs.readFile(readmePath, 'utf8');
      readmeStr = content.substring(0, 3000);
    } catch {}
  }

  return { directoryStructure, packageJsonStr, readmeStr, subPackages };
}

export async function analyzeRepository(repoDir: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    return 'Groq API Key not configured. Add GROQ_API_KEY to your server .env file.';
  }

  const ctx = await gatherRepoContext(repoDir);

  const prompt = `You are an expert software architect analyzing a GitHub repository.

Directory Structure: ${ctx.directoryStructure}

${ctx.packageJsonStr || 'No root package.json found.'}
${ctx.subPackages || ''}

README Excerpt:
${ctx.readmeStr || 'No README found.'}

Provide a concise 3-paragraph professional summary:
1. What does this repository build?
2. What is its architecture and tech stack?
3. How should one run it?
Use markdown formatting.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });
    return completion.choices[0]?.message?.content || 'Unable to generate analysis.';
  } catch (error: any) {
    return `Error communicating with Groq API: ${error.message}`;
  }
}

/**
 * Use AI to extract ONLY the truly secret/critical env vars from the README.
 * 
 * IMPORTANT: We do NOT give the LLM examples of secret names, because it
 * hallucinates and returns all examples as if the project uses them.
 * Instead, we only ask it to identify vars that are EXPLICITLY mentioned
 * in the README or source code.
 */
export async function extractEnvVarsUsingAI(repoDir: string): Promise<string[]> {
  const groq = getGroqClient();
  if (!groq) return [];

  const ctx = await gatherRepoContext(repoDir);

  // If there's no package.json at all (pure HTML/CSS/JS), skip entirely
  if (!ctx.packageJsonStr && !ctx.subPackages) return [];

  // If the README is empty too, nothing to extract from
  if (!ctx.readmeStr) return [];

  const prompt = `Analyze this README and extract ONLY environment variable names that are EXPLICITLY written in the text below.

RULES:
- ONLY return variable names that literally appear in the README text as env var names (like MONGO_URI=xxx or "set your MONGO_URI").
- DO NOT guess or invent variables. DO NOT add variables that are not written in the README.
- DO NOT include: PORT, NODE_ENV, HOST, HOSTNAME, CORS_ORIGIN, CLIENT_URL, FRONTEND_URL, or any localhost URLs.
- If NO environment variables are explicitly mentioned in the README, you MUST return exactly "NONE".

README:
${ctx.readmeStr}

Return ONLY a comma-separated list of the variable names found, or "NONE".`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
    });

    const result = completion.choices[0]?.message?.content?.trim() || 'NONE';
    if (result.toUpperCase().includes('NONE') || result === '') return [];

    return result.split(',')
      .map(s => s.trim().replace(/['"`]/g, '').split('=')[0].trim())
      .filter(s => s.match(/^[A-Z][A-Z0-9_]*$/))
      // Final safety: filter out auto-fillable vars the LLM might still sneak in
      .filter(s => !['PORT', 'NODE_ENV', 'HOST', 'HOSTNAME', 'CORS_ORIGIN',
        'CLIENT_URL', 'FRONTEND_URL', 'VITE_API_URL', 'REACT_APP_API_URL',
        'NEXT_PUBLIC_API_URL', 'VITE_BASE_URL'].includes(s));
  } catch {
    return [];
  }
}

