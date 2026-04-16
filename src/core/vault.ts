import { pathExists, normalizePath } from '../utils/fs.js';
import { join, resolve, dirname, basename } from 'node:path';
import { homedir } from 'node:os';

export interface VaultOptions {
  explicitPath?: string;
}

/**
 * Resolve the vault path in priority order:
 * 1. Explicit --vault argument (expands ~ and normalizes separators)
 * 2. Detect if cwd is INSIDE a vault (cwd contains AGENTS.md, or parent does)
 * 3. Walk upward from cwd looking for .llmwiki/local
 * 4. Walk upward from cwd looking for .llmwiki/global
 * 5. Fallback: ~/.llmwiki/global
 */
export async function resolveVaultPath(options: VaultOptions, cwd: string): Promise<string> {
  // 1. Explicit path
  if (options.explicitPath) {
    return normalizePath(options.explicitPath, cwd);
  }

  // 2. Check if cwd is inside a vault (e.g., user is in .llmwiki/global or .llmwiki/global/raw/personal)
  const vaultFromCwd = await findVaultContaining(cwd);
  if (vaultFromCwd) return vaultFromCwd;

  // 3. Walk upward looking for .llmwiki/local
  const localVault = await findUpward(cwd, '.llmwiki/local');
  if (localVault) return localVault;

  // 4. Walk upward looking for .llmwiki/global
  const globalVault = await findUpward(cwd, '.llmwiki/global');
  if (globalVault) return globalVault;

  // 5. Fallback to home directory
  return join(homedir(), '.llmwiki', 'global').replace(/\\/g, '/');
}

/**
 * Resolve specifically the global vault path.
 * Used by commands that always operate on the global vault (e.g., distill, ingest).
 */
export async function resolveGlobalVaultPath(options: VaultOptions, cwd: string): Promise<string> {
  if (options.explicitPath) {
    return normalizePath(options.explicitPath, cwd);
  }

  // Check if cwd is inside a vault
  const vaultFromCwd = await findVaultContaining(cwd);
  if (vaultFromCwd) return vaultFromCwd;

  const globalVault = await findUpward(cwd, '.llmwiki/global');
  if (globalVault) return globalVault;

  return join(homedir(), '.llmwiki', 'global').replace(/\\/g, '/');
}

/**
 * Given a path (which may be inside a vault), walk UP until we find a directory
 * that contains AGENTS.md — that's the vault root.
 *
 * This handles cases like:
 *   cwd = C:\Users\..\.llmwiki\global          → vault = same dir
 *   cwd = C:\Users\..\.llmwiki\global\raw      → vault = parent
 *   cwd = C:\Users\..\.llmwiki\global\raw\personal → vault = grandparent
 *   cwd = C:\Users\..\.llmwiki                 → vault = global subdir
 */
async function findVaultContaining(startPath: string): Promise<string | null> {
  const normalized = resolve(startPath).replace(/\\/g, '/');

  // Walk upward from startPath, check each dir for AGENTS.md
  let current = normalized;
  let depth = 0;
  const MAX_DEPTH = 8; // don't walk too far up

  while (depth < MAX_DEPTH) {
    const agentsPath = join(current, 'AGENTS.md').replace(/\\/g, '/');
    if (await pathExists(agentsPath)) {
      return current;
    }

    // Special case: if current dir is named ".llmwiki", check if global/ or local/ subdir has AGENTS.md
    if (basename(current) === '.llmwiki') {
      for (const sub of ['global', 'local']) {
        const subVault = join(current, sub).replace(/\\/g, '/');
        const subAgents = join(subVault, 'AGENTS.md').replace(/\\/g, '/');
        if (await pathExists(subAgents)) {
          return subVault;
        }
      }
    }

    const parent = dirname(current).replace(/\\/g, '/');
    if (parent === current) break; // reached filesystem root (handles both / and C:\)
    current = parent;
    depth++;
  }

  return null;
}

/**
 * Walk upward from startDir looking for a subdirectory named `target`.
 * e.g., findUpward('/home/user/project', '.llmwiki/global')
 */
async function findUpward(startDir: string, target: string): Promise<string | null> {
  let current = resolve(startDir).replace(/\\/g, '/');

  while (true) {
    const candidate = join(current, target).replace(/\\/g, '/');
    if (await pathExists(candidate)) {
      return candidate;
    }
    const parent = dirname(current).replace(/\\/g, '/');
    if (parent === current) break; // filesystem root
    current = parent;
  }
  return null;
}

/**
 * Check if a path looks like a valid vault (has AGENTS.md).
 */
export async function isValidVault(vaultPath: string): Promise<boolean> {
  return pathExists(join(vaultPath, 'AGENTS.md').replace(/\\/g, '/'));
}
