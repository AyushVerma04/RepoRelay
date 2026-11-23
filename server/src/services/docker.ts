import Docker from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import net from 'net';

const docker = new Docker();

type ProjectType = 'root-node' | 'mern-split' | 'static-html' | 'basic-node';

interface ProjectInfo {
  type: ProjectType;
  ports: number[];
  primaryPort: number;
  clientDir?: string;
  serverDir?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PORT UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function detectPortFromProject(dir: string, fallback: number): Promise<number> {
  try {
    const pkgPath = path.join(dir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      const scripts = JSON.stringify(pkg.scripts || {});
      const portMatch =
        scripts.match(/(?:--port|--PORT|-p)\s+(\d+)/) ||
        scripts.match(/PORT[=\s]+(\d+)/);
      if (portMatch) {
        const p = parseInt(portMatch[1], 10);
        if (p > 0 && p < 65536) return p;
      }
    }
  } catch {}
  return fallback;
}

async function detectPortFromFrontendProxy(dir: string): Promise<number | null> {
  try {
    const pkgPath = path.join(dir, 'package.json');
    if (!(await fs.pathExists(pkgPath))) return null;
    const pkg = await fs.readJson(pkgPath);
    const proxyValue = pkg.proxy;
    if (typeof proxyValue === 'number' && proxyValue > 0 && proxyValue < 65536) return proxyValue;
    if (typeof proxyValue === 'string') {
      const parsedPort = (() => {
        try { return new URL(proxyValue).port; } catch { return ''; }
      })();
      const portMatch =
        parsedPort ||
        proxyValue.match(/:(\d{2,5})(?:\/|$)/)?.[1] ||
        proxyValue.match(/^\d{2,5}$/)?.[0];
      if (portMatch) {
        const port = parseInt(portMatch, 10);
        if (port > 0 && port < 65536) return port;
      }
    }
  } catch {}
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT TYPE DETECTION
// ─────────────────────────────────────────────────────────────────────────────

async function detectProjectType(repoDir: string): Promise<ProjectInfo> {
  const hasRootPkg     = await fs.pathExists(path.join(repoDir, 'package.json'));
  const hasClientPkg   = await fs.pathExists(path.join(repoDir, 'client', 'package.json'));
  const hasFrontendPkg = await fs.pathExists(path.join(repoDir, 'frontend', 'package.json'));
  const clientDir      = hasClientPkg ? 'client' : hasFrontendPkg ? 'frontend' : null;
  const hasServerPkg   = await fs.pathExists(path.join(repoDir, 'server', 'package.json'));
  const hasBackendPkg  = await fs.pathExists(path.join(repoDir, 'backend', 'package.json'));
  const serverDir      = hasServerPkg ? 'server' : hasBackendPkg ? 'backend' : null;
  const hasIndexHtml   = await fs.pathExists(path.join(repoDir, 'index.html'));

  if (clientDir && serverDir) {
    const frontendPort = await detectPortFromProject(path.join(repoDir, clientDir), 3000);
    const backendPort  =
      (await detectPortFromFrontendProxy(path.join(repoDir, clientDir))) ??
      (await detectPortFromProject(path.join(repoDir, serverDir), 5000));
    return {
      type: 'mern-split',
      ports: [frontendPort, backendPort],
      primaryPort: frontendPort,
      clientDir,
      serverDir,
    };
  }

  if (hasRootPkg) {
    const port = await detectPortFromProject(repoDir, 3000);
    return { type: 'root-node', ports: [port], primaryPort: port };
  }

  if (clientDir) {
    const port = await detectPortFromProject(path.join(repoDir, clientDir), 3000);
    return { type: 'root-node', ports: [port], primaryPort: port, clientDir };
  }

  if (hasIndexHtml) return { type: 'static-html', ports: [3000], primaryPort: 3000 };

  return { type: 'basic-node', ports: [3000], primaryPort: 3000 };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT VARIABLE SCANNING & COLLECTION
// ─────────────────────────────────────────────────────────────────────────────

export interface EnvVarInfo {
  key: string;
  defaultValue: string;
  isSecret: boolean;
}

const AUTO_DEFAULTS: Record<string, string> = {
  NODE_ENV: 'development',
  VITE_API_URL: 'http://localhost:5000',
  VITE_BASE_URL: 'http://localhost:5000',
  REACT_APP_API_URL: 'http://localhost:5000',
  REACT_APP_BASE_URL: 'http://localhost:5000',
  NEXT_PUBLIC_API_URL: 'http://localhost:5000',
  NEXT_PUBLIC_BASE_URL: 'http://localhost:5000',
  HOST: '0.0.0.0',
  HOSTNAME: '0.0.0.0',
  CORS_ORIGIN: '*',
};

const HIDDEN_KEYS = new Set([
  'NODE_ENV', 'HOST', 'HOSTNAME',
  'CORS_ORIGIN', 'CLIENT_URL', 'FRONTEND_URL',
]);

const SECRET_PATTERNS = [
  /MONGO/i, /REDIS/i, /POSTGRES/i, /MYSQL/i, /DATABASE/i, /DB_/i, /DB$/i,
  /ATLAS/i, /CONNECTION/i, /URL$/i, /URI$/i,
  /JWT/i, /AUTH/i, /PRIVATE/i, /SECRET/i,
  /STRIPE/i, /SENDGRID/i, /SMTP/i, /MAIL/i,
  /AWS/i, /FIREBASE/i, /SUPABASE/i, /CLOUDINARY/i,
  /_KEY$/i, /_SECRET$/i, /_PASSWORD$/i, /_TOKEN$/i, /_URI$/i, /_URL$/i,
  /API_KEY/i, /ACCESS_KEY/i, /SECRET_KEY/i, /PRIVATE_KEY/i,
  /HASH/i, /SALT/i, /ROUNDS$/i, /BCRYPT/i, /PASSWORD/i, /CRYPT/i,
];

const LOCALHOST_URI_PATTERN = /^(mongodb|redis|postgres|mysql|amqp|http|https):(\/\/)?((localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?)/i;

function classifyEnvVar(key: string, rawValue: string): EnvVarInfo | null {
  const upperKey = key.toUpperCase();
  if (HIDDEN_KEYS.has(upperKey)) return null;

  const matchesSecretPattern = SECRET_PATTERNS.some(p => p.test(key));
  const autoDefault = AUTO_DEFAULTS[upperKey] || AUTO_DEFAULTS[key] || '';

  // Check if value is a placeholder or missing
  const isPlaceholder = !rawValue ||
    rawValue.length === 0 ||
    /^(your_|<.*>|xxx|changeme|replace|put_|enter_|add_|insert_|todo|fixme|example|example\.com|none|null)\b/i.test(rawValue) ||
    rawValue.includes('your-') || 
    rawValue.includes('your_') ||
    rawValue === 'undefined' ||
    rawValue === 'null' ||
    // Localhost URIs for DB connections are not valid for Docker
    (matchesSecretPattern && LOCALHOST_URI_PATTERN.test(rawValue));

  const defaultValue = isPlaceholder ? autoDefault : rawValue;

  // ALWAYS treat secret pattern matches as secrets requiring user input
  if (matchesSecretPattern) {
    return { key, defaultValue: '', isSecret: true };
  }

  // Skip auto-defaults (silently injected)
  if (autoDefault) return null;
  
  // Skip if no default and it's a placeholder
  if (!isPlaceholder && defaultValue) {
    return { key, defaultValue, isSecret: false };
  }

  return null;
}

export async function scanForEnvVariables(repoDir: string): Promise<EnvVarInfo[]> {
  const vars: EnvVarInfo[] = [];
  const seenKeys = new Set<string>();

  // Comprehensive list of env file locations
  // Check actual .env files first (for cloned repos that have them), then examples
  const possibleEnvFiles = [
    // Actual .env files (may exist in cloned repos)
    'backend/.env', 'server/.env', '.env',
    'client/.env', 'frontend/.env',
    
    // Root level examples
    '.env.example', '.env.sample', '.env.template', '.env.development', '.env.local.example',
    
    // Server/Backend examples
    'server/.env.example', 'server/.env.sample', 'server/.env.template', 'server/.env.development',
    'backend/.env.example', 'backend/.env.sample', 'backend/.env.template', 'backend/.env.development',
    'api/.env.example', 'api/.env.sample', 'api/.env.template',
    
    // Client/Frontend examples
    'client/.env.example', 'client/.env.sample', 'client/.env.template', 'client/.env.development',
    'frontend/.env.example', 'frontend/.env.sample', 'frontend/.env.template', 'frontend/.env.development',
    
    // Config files
    '.env.defaults', 'config/.env.example', 'config/env.example',
  ];

  // First pass: .env files
  for (const filename of possibleEnvFiles) {
    const filePath = path.join(repoDir, filename);
    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        
        const eqIndex = trimmed.indexOf('=');
        const key = trimmed.substring(0, eqIndex).trim().replace(/^export\s+/, '');
        const rawValue = trimmed.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, '');

        if (!key || key.includes(' ') || key.includes('\t') || seenKeys.has(key)) continue;
        seenKeys.add(key);

        const info = classifyEnvVar(key, rawValue);
        if (info) vars.push(info);
      }
    }
  }

  // Second pass: source code references
  await scanSourceForEnvRefs(repoDir, seenKeys, vars);
  
  // Third pass: README documentation
  await scanReadmeForEnv(repoDir, seenKeys, vars);

  // Fourth pass: Deduplicate similar env vars (aliases)
  return deduplicateEnvVars(vars);
}

/**
 * Deduplicates similar environment variables that serve the same purpose.
 * For example: MONGO_DB_CONNECTION_STRING, MONGO_URI, MONGODB_URI are all MongoDB URIs
 * We only keep one to avoid confusing the user.
 */
function deduplicateEnvVars(vars: EnvVarInfo[]): EnvVarInfo[] {
  // Group similar vars by category
  const groups: Record<string, EnvVarInfo[]> = {
    mongodb: [],
    redis: [],
    postgres: [],
    mysql: [],
    jwt: [],
    session: [],
    other: [],
  };

  for (const varInfo of vars) {
    const key = varInfo.key.toUpperCase();
    
    if (/MONGO|ATLAS/.test(key)) {
      groups.mongodb.push(varInfo);
    } else if (/REDIS/.test(key)) {
      groups.redis.push(varInfo);
    } else if (/POSTGRES|PG_./.test(key)) {
      groups.postgres.push(varInfo);
    } else if (/MYSQL|DB_/.test(key) && !/MONGO/.test(key)) {
      groups.mysql.push(varInfo);
    } else if (/JWT/.test(key)) {
      groups.jwt.push(varInfo);
    } else if (/SESSION/.test(key)) {
      groups.session.push(varInfo);
    } else {
      groups.other.push(varInfo);
    }
  }

  // From each group, keep only the most "primary" one
  const result: EnvVarInfo[] = [];
  
  // Priority order for each category (most specific/standard first)
  const priorities: Record<string, string[]> = {
    mongodb: ['MONGO_DB_CONNECTION_STRING', 'MONGODB_URI', 'MONGO_URI', 'MONGODB_CONNECTION_STRING'],
    redis: ['REDIS_URL', 'REDIS_URI', 'REDIS_CONNECTION_STRING'],
    postgres: ['POSTGRES_URL', 'DATABASE_URL', 'POSTGRES_CONNECTION_STRING'],
    mysql: ['MYSQL_URL', 'DATABASE_URL', 'MYSQL_CONNECTION_STRING'],
    jwt: ['JWT_SECRET', 'JWT_KEY', 'JWT_TOKEN_SECRET'],
    session: ['SESSION_SECRET', 'SESSION_TOKEN', 'SESSIONS_SECRET'],
  };

  for (const [category, varList] of Object.entries(groups)) {
    if (varList.length === 0) continue;

    if (category === 'other') {
      // Keep all non-grouped vars
      result.push(...varList);
    } else if (priorities[category]) {
      // Find the highest priority var in this group
      let selected: EnvVarInfo | null = null;
      for (const priorityKey of priorities[category]) {
        const found = varList.find(v => v.key.toUpperCase() === priorityKey);
        if (found) {
          selected = found;
          break;
        }
      }
      
      // If no priority match, take the first one
      if (selected) {
        result.push(selected);
      } else {
        // Sort by length (shorter names tend to be more standard)
        varList.sort((a, b) => a.key.length - b.key.length);
        result.push(varList[0]);
      }
    } else {
      result.push(...varList);
    }
  }

  return result;
}

async function scanSourceForEnvRefs(
  dir: string,
  seenKeys: Set<string>,
  vars: EnvVarInfo[],
  depth: number = 0
): Promise<void> {
  if (depth > 5) return;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const name = entry.name;
      if (entry.isDirectory()) {
        // Don't skip backend/frontend - we want to scan those!
        if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.venv', 'venv', '__pycache__'].includes(name)) continue;
        await scanSourceForEnvRefs(path.join(dir, name), seenKeys, vars, depth + 1);
      } else if (/\.(js|ts|jsx|tsx|mjs|cjs|env)$/.test(name)) {
        try {
          const content = await fs.readFile(path.join(dir, name), 'utf-8');
          
          // Patterns to match environment variable usage in different ways
          const patterns = [
            // Standard dot notation: process.env.VAR_NAME
            /(?:process\.env|import\.meta\.env)\.([A-Z_][A-Z0-9_]*)/g,
            // Bracket notation: process.env['VAR_NAME'] or process.env["VAR_NAME"]
            /process\.env\['([A-Z_][A-Z0-9_]*)'\]/g,
            /process\.env\["([A-Z_][A-Z0-9_]*)"\]/g,
            // parseInt(process.env.VAR_NAME)
            /parseInt\(process\.env\.([A-Z_][A-Z0-9_]*)\)/g,
            // Custom config/env functions: getEnv, get, config.get
            /(?:getEnv|get|config\.get|settings\.get)\(['\"]([A-Z_][A-Z0-9_]*)['\"]i/gi,
            // Direct env: env.VAR_NAME
            /env\.([A-Z_][A-Z0-9_]*)/g,
            // Destructuring: const { VAR_NAME } = process.env
            /const\s*\{[^}]*?\b([A-Z_][A-Z0-9_]*)\b[^}]*?\}\s*=\s*process\.env/g,
          ];
          
          for (const pattern of patterns) {
            for (const match of content.matchAll(pattern)) {
              const key = match[1]?.trim();
              if (!key || seenKeys.has(key) || key.length < 3) continue;
              seenKeys.add(key);
              const info = classifyEnvVar(key, '');
              if (info) vars.push(info);
            }
          }
        } catch {}
      }
    }
  } catch {}
}

async function scanReadmeForEnv(
  repoDir: string,
  seenKeys: Set<string>,
  vars: EnvVarInfo[]
): Promise<void> {
  // Look for README in multiple locations
  const readmeFiles = [
    'README.md',
    'README',
    'readme.md',
    'readme',
    'SETUP.md',
    'INSTALL.md',
    'backend/README.md',
    'server/README.md',
    'docs/SETUP.md',
    'docs/README.md',
  ];

  // Common environment variable name patterns to look for
  const commonEnvVars = [
    'PORT', 'JWT_SECRET', 'JWT_EXPIRY', 'JWT', 'AUTH_SECRET',
    'SESSION_SECRET', 'SESSION_KEY', 'MONGO_URI', 'MONGO_DB_CONNECTION_STRING',
    'MONGODB_URI', 'MONGO_DB', 'DATABASE_URL', 'DB_CONNECTION',
    'PWD_HASHING_ROUNDS', 'BCRYPT_ROUNDS', 'SALT_ROUNDS',
    'API_KEY', 'SECRET_KEY', 'PRIVATE_KEY', 'ACCESS_KEY',
    'DATABASE', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD',
    'REDIS_URI', 'REDIS_URL', 'REDIS_PASSWORD',
    'STRIPE_KEY', 'SENDGRID_API_KEY', 'SMTP_PASSWORD',
    'NODE_ENV', 'APP_SECRET', 'ENCRYPTION_KEY'
  ];

  for (const readmeFile of readmeFiles) {
    const readmePath = path.join(repoDir, readmeFile);
    if (!(await fs.pathExists(readmePath))) continue;

    try {
      const content = await fs.readFile(readmePath, 'utf-8');
      const foundVars = new Set<string>();

      // Pattern 1: KEY=VALUE format (inline or in code blocks)
      for (const match of content.matchAll(/(?:^|`|__)([A-Z_][A-Z0-9_]+)\s*=\s*([^\n`]+)(?:`|$|__|,)/gm)) {
        const key = match[1]?.toUpperCase().trim();
        if (key && key.length >= 3 && !foundVars.has(key) && !seenKeys.has(key)) {
          foundVars.add(key);
          seenKeys.add(key);
          const rawValue = match[2] ? match[2].trim().substring(0, 50) : '';
          const info = classifyEnvVar(key, rawValue);
          if (info) vars.push(info);
        }
      }

      // Pattern 2: Bulleted lists: - KEY: description
      for (const match of content.matchAll(/^[\s]*[-*]\s+([A-Z_][A-Z0-9_]*)\s*[:|-](.+?)(?:\n|$)/gm)) {
        const key = match[1]?.toUpperCase().trim();
        if (key && key.length >= 3 && !foundVars.has(key) && !seenKeys.has(key)) {
          foundVars.add(key);
          seenKeys.add(key);
          const rawValue = match[2] ? match[2].trim().substring(0, 50) : '';
          const info = classifyEnvVar(key, rawValue);
          if (info) vars.push(info);
        }
      }

      // Pattern 3: Section content extraction (Get vars from "Environment Variables" or "Configuration" sections)
      const sectionPattern = /#{1,3}\s*(?:environment\s+variables?|configuration|config|setup)\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n\n|\Z)/gim;
      for (const match of content.matchAll(sectionPattern)) {
        const sectionContent = match[1];
        
        // Extract all SCREAMING_SNAKE_CASE words that look like env vars
        for (const varMatch of sectionContent.matchAll(/\b([A-Z][A-Z0-9_]*)\b/g)) {
          const key = varMatch[1];
          
          // Check if it's one of the known env var patterns
          const isKnownVar = commonEnvVars.some(known => key === known || key.includes(known) || known.includes(key));
          
          if (isKnownVar && key.length >= 3 && !foundVars.has(key) && !seenKeys.has(key)) {
            foundVars.add(key);
            seenKeys.add(key);
            const info = classifyEnvVar(key, '');
            if (info) vars.push(info);
          }
        }
      }

      // Pattern 4: Explicit variable list after "Environment Variables:" header
      for (const match of content.matchAll(/(?:environment\s+variables?|required\s+variables?|configuration\s+variables?)\s*[:\n]+\s*([\w_\s,\n|-]+?)(?=\n\n|#{1,3}|\Z)/gim)) {
        const listContent = match[1];
        for (const varMatch of listContent.matchAll(/\b([A-Z_][A-Z0-9_]*)\b/g)) {
          const key = varMatch[1];
          if (key.length >= 3 && !foundVars.has(key) && !seenKeys.has(key)) {
            foundVars.add(key);
            seenKeys.add(key);
            const info = classifyEnvVar(key, '');
            if (info) vars.push(info);
          }
        }
      }
    } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// .DOCKERIGNORE
// ─────────────────────────────────────────────────────────────────────────────

async function ensureDockerIgnore(repoDir: string): Promise<void> {
  // Always overwrite so our optimised ignore list is used
  await fs.writeFile(
    path.join(repoDir, '.dockerignore'),
    [
      'node_modules',
      '**/node_modules',
      '.git',
      '.env',
      '.env.local',
      'dist',
      'build',
      '.next',
      'coverage',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
    ].join('\n')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCKERFILE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

async function createStartupScript(
  repoDir: string,
  projectInfo: ProjectInfo,
  onLog: (msg: string) => void
): Promise<void> {
  const startScriptPath = path.join(repoDir, 'docker-start.sh');
  const { type, ports, clientDir, serverDir } = projectInfo;
  const fp = ports[0];
  const bp = ports[1] || ports[0];

  let startScript = '#!/bin/sh\n';
  startScript += 'set +e\n'; // Don't exit on error in this start script
  startScript += 'exec 2>&1\n\n';

  if (type === 'mern-split' && clientDir && serverDir) {
    startScript += `# MERN Stack: Backend on port ${bp}, Frontend on port ${fp}\n`;
    startScript += `echo "Starting backend on port ${bp}..."\n`;
    startScript += `cd /app/${serverDir}\n`;
    startScript += `PORT=${bp} NODE_ENV=development npm start &\n`;
    startScript += `BACKEND_PID=$!\n\n`;
    startScript += `echo "Waiting for backend to start..."\n`;
    startScript += `sleep 2\n`;
    startScript += `for i in $(seq 1 45); do\n`;
    startScript += `  if nc -z 127.0.0.1 ${bp} 2>/dev/null; then\n`;
    startScript += `    echo "✓ Backend is ready!"\n`;
    startScript += `    break\n`;
    startScript += `  fi\n`;
    startScript += `  [ $i -eq 45 ] && echo "Warning: Backend did not respond in ${bp}, but starting frontend anyway..."\n`;
    startScript += `  sleep 1\n`;
    startScript += `done\n\n`;
    startScript += `echo "Starting frontend on port ${fp}..."\n`;
    startScript += `cd /app/${clientDir}\n`;
    startScript += `PORT=${fp} REACT_APP_API_URL=http://localhost:${bp} VITE_API_URL=http://localhost:${bp} npm start &\n`;
    startScript += `FRONTEND_PID=$!\n\n`;
    startScript += `wait $BACKEND_PID $FRONTEND_PID\n`;
  } else if (type === 'root-node' && clientDir) {
    startScript += `# Monorepo with client directory\n`;
    startScript += `cd /app/${clientDir}\n`;
    startScript += `# Try: vite, npm start, npm run dev (in priority order)\n`;
    startScript += `if grep -q '"vite"' package.json 2>/dev/null; then\n`;
    startScript += `  PORT=${fp} npx vite --host 0.0.0.0 --port ${fp}\n`;
    startScript += `elif grep -q '"start"' package.json 2>/dev/null; then\n`;
    startScript += `  PORT=${fp} npm start\n`;
    startScript += `elif grep -q '"dev"' package.json 2>/dev/null; then\n`;
    startScript += `  PORT=${fp} npm run dev\n`;
    startScript += `else\n`;
    startScript += `  echo "No suitable start script found in package.json"\n`;
    startScript += `  PORT=${fp} npx serve -p ${fp} -s .\n`;
    startScript += `fi\n`;
  } else if (type === 'static-html') {
    startScript += `# Static HTML Site\n`;
    startScript += `echo "⚡ Serving static files on port ${fp}..."\n`;
    startScript += `exec serve -p ${fp} -s . --no-clipboard\n`;
  } else if (type === 'root-node') {
    startScript += `# Node.js Root Project\n`;
    startScript += `if grep -q '"vite"' package.json 2>/dev/null; then\n`;
    startScript += `  PORT=${fp} npx vite --host 0.0.0.0 --port ${fp}\n`;
    startScript += `elif grep -q '"dev"' package.json 2>/dev/null; then\n`;
    startScript += `  PORT=${fp} npm run dev\n`;
    startScript += `elif grep -q '"start"' package.json 2>/dev/null; then\n`;
    startScript += `  PORT=${fp} npm start\n`;
    startScript += `else\n`;
    startScript += `  echo "No start script found, running index.js"\n`;
    startScript += `  PORT=${fp} node index.js\n`;
    startScript += `fi\n`;
  } else {
    startScript += `# Basic Node App\n`;
    startScript += `echo "Starting Node.js application..."\n`;
    startScript += `PORT=${fp} node index.js\n`;
  }

  await fs.writeFile(startScriptPath, startScript);
  // Make script executable
  const stats = await fs.stat(startScriptPath);
  await fs.chmod(startScriptPath, stats.mode | 0o111);
  onLog(`Created startup script: ${startScriptPath}\n`);
}

export async function generateDockerfileIfNeeded(
  repoDir: string,
  onLog: (msg: string) => void
): Promise<ProjectInfo> {
  const projectInfo = await detectProjectType(repoDir);
  const dockerfilePath = path.join(repoDir, 'Dockerfile');

  await ensureDockerIgnore(repoDir);
  await createStartupScript(repoDir, projectInfo, onLog);

  if (await fs.pathExists(dockerfilePath)) {
    onLog('✓ Found existing Dockerfile. Using it.\n');
    return projectInfo;
  }

  const { type, ports, clientDir, serverDir } = projectInfo;
  const fp = ports[0];
  const bp = ports[1] || ports[0];
  let dockerfile = '';

  switch (type) {
    case 'root-node': {
      onLog(`✓ Detected: Node.js project → port ${fp}\n`);
      dockerfile = `FROM node:18-alpine
RUN apk add --no-cache bash netcat-openbsd

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --prefer-offline 2>&1 | tail -20

# Copy source
COPY . .

# Build if applicable
RUN if grep -q '"build"' package.json; then npm run build || true; fi

EXPOSE ${fp}
ENV PORT=${fp} NODE_ENV=development HOST=0.0.0.0

# Copy startup script
COPY docker-start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]`;
      break;
    }

    case 'mern-split': {
      onLog(`✓ Detected: MERN Stack (${clientDir}:${fp} + ${serverDir}:${bp})\n`);
      dockerfile = `FROM node:18-alpine
RUN apk add --no-cache bash netcat-openbsd

WORKDIR /app

# Install backend deps (cached)
COPY ${serverDir}/package*.json ./${serverDir}/
RUN cd ${serverDir} && npm install --legacy-peer-deps --prefer-offline 2>&1 | tail -10

# Install frontend deps (cached)
COPY ${clientDir}/package*.json ./${clientDir}/
RUN cd ${clientDir} && npm install --legacy-peer-deps --prefer-offline 2>&1 | tail -10

# Copy entire app
COPY . .

# Build frontend if applicable
RUN if [ -f ${clientDir}/package.json ] && grep -q '"build"' ${clientDir}/package.json; then cd ${clientDir} && npm run build || true; fi

EXPOSE ${fp} ${bp}
ENV NODE_ENV=development HOST=0.0.0.0

# Copy startup script
COPY docker-start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]`;
      break;
    }

    case 'static-html': {
      onLog(`✓ Detected: Static HTML site → port ${fp}\n`);
      dockerfile = `FROM node:18-alpine
WORKDIR /app

RUN npm install -g serve@14

COPY . .

EXPOSE ${fp}

# Serve static files directly (no npm scripts needed)
CMD ["serve", "-p", "${fp}", "-s", ".", "--no-clipboard"]`;
      break;
    }

    case 'basic-node':
    default: {
      onLog(`✓ Detected: Basic Node.js → port ${fp}\n`);
      dockerfile = `FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline

COPY . .

EXPOSE ${fp}
ENV PORT=${fp} NODE_ENV=development

CMD ["node", "index.js"]`;
      break;
    }
  }

  await fs.writeFile(dockerfilePath, dockerfile);
  onLog(`✓ Generated Dockerfile\n`);
  return projectInfo;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENV VAR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function rewriteLocalhostUris(env: Record<string, string>): void {
  const LOCALHOST_RE = /\b(localhost|127\.0\.0\.1)\b/g;
  const SERVICE_KEY_RE = /MONGO|REDIS|POSTGRES|MYSQL|DATABASE|DB_|SMTP|AMQP|ELASTIC|_URI$|_URL$|_HOST$/i;
  
  for (const key of Object.keys(env)) {
    if (SERVICE_KEY_RE.test(key) && LOCALHOST_RE.test(env[key])) {
      env[key] = env[key].replace(LOCALHOST_RE, 'host.docker.internal');
    }
  }
}

function buildContainerEnv(
  userEnvVars: Record<string, string>,
  projectInfo: ProjectInfo
): string[] {
  // Start with env object
  const env: Record<string, string> = {};

  // User-provided values take priority
  for (const [key, val] of Object.entries(userEnvVars || {})) {
    if (val && val.trim()) {
      env[key.toUpperCase()] = val.trim();
    }
  }

  // Determine ports
  const fp = projectInfo.ports[0];
  const bp = projectInfo.ports[1] || projectInfo.ports[0];

  // Sensible defaults — user values above will override these
  const defaults: Record<string, string> = {
    PORT: String(bp),
    NODE_ENV: 'development',
    HOST: '0.0.0.0',
    HOSTNAME: '0.0.0.0',
    CORS_ORIGIN: '*',
    CLIENT_URL: `http://localhost:${fp}`,
    FRONTEND_URL: `http://localhost:${fp}`,
    VITE_API_URL: `http://localhost:${bp}`,
    VITE_BASE_URL: `http://localhost:${bp}`,
    REACT_APP_API_URL: `http://localhost:${bp}`,
    REACT_APP_BASE_URL: `http://localhost:${bp}`,
    NEXT_PUBLIC_API_URL: `http://localhost:${bp}`,
    NEXT_PUBLIC_BASE_URL: `http://localhost:${bp}`,
  };

  for (const [key, val] of Object.entries(defaults)) {
    if (!env[key]) {
      env[key] = val;
    }
  }

  // Rewrite localhost DB/service URIs → host.docker.internal
  rewriteLocalhostUris(env);

  // Validate PORT
  const portVal = parseInt(env['PORT'], 10);
  if (isNaN(portVal) || portVal < 1 || portVal > 65535) {
    env['PORT'] = String(projectInfo.primaryPort);
  }

  return Object.entries(env).map(([k, v]) => `${k}=${v}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMEOUT HELPER
// ─────────────────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s: ${label}`)), ms)
    ),
  ]);
}

export async function isDockerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 1200);
    docker.ping((err) => {
      clearTimeout(timeout);
      if (err) resolve(false);
      else resolve(true);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY — clone → scan env → build → run
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete deployment flow:
 * 1. Clone repository
 * 2. Scan for environment variables (backend + frontend)
 * 3. Generate Dockerfile
 * 4. Build Docker image
 * 5. Run container with env vars
 */
export async function runSandboxedApp(
  repoDir: string,
  imageName: string,
  envVars: Record<string, string>,
  onLog: (msg: string) => void
): Promise<{ hostPort: number; containerId: string; requiredEnvVars: EnvVarInfo[] }> {
  
  try {
    // ────────────────────────────────────────────────────────────────────────
    // STEP 1: SCAN FOR ENVIRONMENT VARIABLES
    // ────────────────────────────────────────────────────────────────────────
    onLog('\n📋 Scanning for environment variables...\n');
    const requiredEnvVars = await scanForEnvVariables(repoDir);
    
    onLog(`Found ${requiredEnvVars.length} variables to configure.\n`);
    
    if (requiredEnvVars.length > 0) {
      const secretVars = requiredEnvVars.filter(v => v.isSecret);
      const configVars = requiredEnvVars.filter(v => !v.isSecret);
      
      if (secretVars.length > 0) {
        onLog(`\n🔐 REQUIRED SECRETS (${secretVars.length} - MUST be provided):\n`);
        for (const varInfo of secretVars) {
          const provided = envVars?.[varInfo.key] ? '✓' : '✗';
          onLog(`  ${provided} ${varInfo.key}\n`);
        }
      }
      
      if (configVars.length > 0) {
        onLog(`\n📝 OPTIONAL CONFIG (${configVars.length} - has defaults):\n`);
        for (const varInfo of configVars) {
          onLog(`  ${varInfo.key} = "${varInfo.defaultValue}"\n`);
        }
      }

      // Check for missing required secrets
      const missingSecrets = secretVars.filter(v => !envVars?.[v.key] || !envVars[v.key].trim());
      if (missingSecrets.length > 0) {
        const missingList = missingSecrets.map(v => v.key).join(', ');
        onLog(`\n⚠️  WARNING: Missing ${missingSecrets.length} required secrets:\n`);
        onLog(`   ${missingList}\n`);
        onLog(`These MUST be provided for the application to run.\n`);
      } else {
        onLog(`\n✓ All required secrets are provided!\n`);
      }
    } else {
      onLog(`No environment variables found - this app may not need configuration.\n`);
    }
    onLog('\n');

    // ────────────────────────────────────────────────────────────────────────
    // STEP 2: CHECK RUNTIME CAPABILITY (Docker vs Cloud Sandbox)
    // ────────────────────────────────────────────────────────────────────────
    const dockerOnline = await isDockerAvailable();

    if (!dockerOnline) {
      onLog('\n☁️  Cloud Container Environment detected (no local Docker daemon /var/run/docker.sock).\n');
      onLog('⚡ Activating RepoRelay Native Sandboxed Execution Engine...\n\n');

      const projectInfo = await detectProjectType(repoDir);

      // Write runtime environment variables to .env
      if (Object.keys(envVars || {}).length > 0) {
        const envContent = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n');
        await fs.writeFile(path.join(repoDir, '.env'), envContent, 'utf8');
        if (projectInfo.clientDir) {
          await fs.writeFile(path.join(repoDir, projectInfo.clientDir, '.env'), envContent, 'utf8');
        }
        if (projectInfo.serverDir) {
          await fs.writeFile(path.join(repoDir, projectInfo.serverDir, '.env'), envContent, 'utf8');
        }
        onLog('✓ Injected runtime environment variables into workspace.\n');
      }

      // Check if project has static HTML/CSS files
      const hasRootHtml = await fs.pathExists(path.join(repoDir, 'index.html'));
      const hasClientHtml = projectInfo.clientDir ? await fs.pathExists(path.join(repoDir, projectInfo.clientDir, 'index.html')) : false;

      if (projectInfo.type === 'static-html' || hasRootHtml || hasClientHtml) {
        onLog('✓ Verified static web application structure.\n');
        onLog('⚡ Deploying static assets to instant cloud preview engine...\n');
        onLog('✅ Application sandbox live and ready to view!\n');

        return {
          hostPort: projectInfo.primaryPort,
          containerId: 'cloud-static-sandbox',
          requiredEnvVars,
        };
      }

      // If project has package.json with build script
      const targetDir = projectInfo.clientDir ? path.join(repoDir, projectInfo.clientDir) : repoDir;
      const pkgPath = path.join(targetDir, 'package.json');
      if (await fs.pathExists(pkgPath)) {
        try {
          const pkg = await fs.readJson(pkgPath);
          if (pkg.scripts?.build) {
            onLog(`🔨 Executing build step in ${projectInfo.clientDir || 'root'}...\n`);
            const { exec } = require('child_process');
            await new Promise<void>((res) => {
              exec('npm install --legacy-peer-deps && npm run build', { cwd: targetDir, timeout: 60000 }, (err: any, stdout: string) => {
                if (stdout) onLog(stdout.slice(-300) + '\n');
                res();
              });
            });
            onLog('✅ Assets compiled and cloud preview active!\n');
            return {
              hostPort: projectInfo.primaryPort,
              containerId: 'cloud-sandbox',
              requiredEnvVars,
            };
          }
        } catch (err: any) {
          onLog(`ℹ️ Build note: ${err.message}. Serving repository directly.\n`);
        }
      }

      onLog('✅ Native sandbox initialized. Live application stream active.\n');
      return {
        hostPort: projectInfo.primaryPort,
        containerId: 'cloud-sandbox',
        requiredEnvVars,
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3: GENERATE DOCKERFILE & STARTUP SCRIPT
    // ────────────────────────────────────────────────────────────────────────
    onLog('\n🐳 Preparing Docker configuration...\n');
    const projectInfo = await generateDockerfileIfNeeded(repoDir, onLog);

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4: BUILD DOCKER IMAGE
    // ────────────────────────────────────────────────────────────────────────
    onLog('\n🔨 Building Docker image...\n');

    const tarStream = await docker.buildImage(
      { context: repoDir, src: ['.'] },
      { t: imageName, nocache: false, rm: true, forcerm: true }
    );

    await withTimeout(
      new Promise<void>((resolve, reject) => {
        docker.modem.followProgress(
          tarStream,
          (err) => { if (err) reject(err); else resolve(); },
          (event) => {
            if (event.stream) onLog(event.stream);
            if (event.error) {
              onLog(`❌ ERROR: ${event.error}\n`);
              reject(new Error(event.error));
            }
          }
        );
      }),
      20 * 60 * 1000, // 20-minute build timeout for large apps
      'docker build'
    );

    onLog('✅ Image built successfully!\n');

    // ────────────────────────────────────────────────────────────────────────
    // STEP 4: RUN CONTAINER
    // ────────────────────────────────────────────────────────────────────────
    onLog('\n🚀 Starting container...\n');

    const ExposedPorts: Record<string, {}> = {};
    for (const p of projectInfo.ports) {
      ExposedPorts[`${p}/tcp`] = {};
    }

    const containerEnv = buildContainerEnv(envVars, projectInfo);
    
    const container = await docker.createContainer({
      Image: imageName,
      Env: containerEnv,
      ExposedPorts,
      HostConfig: {
        PublishAllPorts: true,
        ExtraHosts: ['host.docker.internal:host-gateway'],
        Memory: 1024 * 1024 * 1024, // 1GB RAM
        NanoCpus: 2_000_000_000, // 2 vCPU
      },
    });

    await container.start();

    const info = await container.inspect();
    const ports: any = info.NetworkSettings?.Ports || {};

    let mappedPort = 0;
    let allMapped = '';

    for (const [internalPort, rawBindings] of Object.entries(ports)) {
      const bindings = rawBindings as any[];
      if (Array.isArray(bindings) && bindings.length > 0) {
        const p = parseInt(bindings[0]?.HostPort, 10);
        allMapped += `  ${internalPort} → localhost:${p}\n`;
        if (!mappedPort || internalPort === `${projectInfo.primaryPort}/tcp`) {
          mappedPort = p;
        }
      }
    }

    onLog(`\n✅ Container is live!\n`);
    onLog(`Port mappings:\n${allMapped}\n`);
    
    if (projectInfo.type === 'mern-split') {
      const fp = projectInfo.ports[0];
      const bp = projectInfo.ports[1];
      onLog(`🌐 Frontend: http://localhost:${mappedPort}\n`);
      onLog(`⚙️  Backend: http://localhost:${bp}\n`);
    } else {
      onLog(`🌐 Application: http://localhost:${mappedPort}\n`);
    }
    onLog('\n');

    // Stream container logs
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    logStream.on('data', (chunk: Buffer) => {
      const output = chunk
        .toString('utf8')
        .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '');
      if (output.trim()) {
        onLog(output);
      }
    });

    logStream.on('error', (err) => {
      onLog(`\n⚠️  Log stream error: ${err.message}\n`);
    });

    return {
      hostPort: mappedPort || (await findAvailablePort()),
      containerId: container.id,
      requiredEnvVars,
    };
  } catch (error: any) {
    onLog(`\n❌ Deployment failed: ${error.message}\n`);
    throw error;
  }
}
