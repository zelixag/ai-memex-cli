import { pathExists } from '../utils/fs.js';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';

export interface VaultOptions {
  explicitPath?: string;
}

/**
 * Resolve the vault path in priority order:
 * 1. Explicit --vault argument
 * 2. Nearest .llmwiki/local (upward traversal from cwd)
 * 3. Nearest .llmwiki/global (upward traversal from cwd)
 * 4. Fallback: ~/.llmwiki/global
 */
export async function resolveVaultPath(options: VaultOptions, cwd: string): Promise<string> {
  // 1. Explicit path
  if (options.explicitPath) {
    const explicit = resolve(cwd, options.explicitPath).replace(/\\/g, '/');
    return explicit;
  }

  // 2. Walk upward looking for .llmwiki/local
  const localVault = await findUpward(cwd, '.llmwiki/local');
  if (localVault) return localVault;

  // 3. Walk upward looking for .llmwiki/global
  const globalVault = await findUpward(cwd, '.llmwiki/global');
  if (globalVault) return globalVault;

  // 4. Fallback to home directory
  return join(homedir(), '.llmwiki', 'global').replace(/\\/g, '/');
}

/**
 * Resolve specifically the global vault path.
 * Used by commands that always operate on the global vault (e.g., distill, ingest).
 */
export async function resolveGlobalVaultPath(options: VaultOptions, cwd: string): Promise<string> {
  if (options.explicitPath) {
    return resolve(cwd, options.explicitPath).replace(/\\/g, '/');
  }

  const globalVault = await findUpward(cwd, '.llmwiki/global');
  if (globalVault) return globalVault;

  return join(homedir(), '.llmwiki', 'global').replace(/\\/g, '/');
}

async function findUpward(startDir: string, target: string): Promise<string | null> {
  let current = resolve(startDir);
  const root = dirname(current) === current ? current : '/';

  while (true) {
    const candidate = join(current, target).replace(/\\/g, '/');
    if (await pathExists(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/**
 * Check if a path looks like a valid vault (has AGENTS.md).
 */
export async function isValidVault(vaultPath: string): Promise<boolean> {
  return pathExists(join(vaultPath, 'AGENTS.md'));
}
