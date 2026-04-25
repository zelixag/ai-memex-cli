import { pathExists, normalizePath } from '../utils/fs.js';
import { join, resolve, dirname, basename } from 'node:path';
import { homedir } from 'node:os';
import {
  VAULT_SCHEMA_MARKDOWN_FILENAMES,
  vaultSchemaFilenameForAgent,
  isKnownAgentId,
  type AgentId,
} from './agent-adapter.js';

export interface VaultOptions {
  explicitPath?: string;
}

/**
 * Resolve the vault path in priority order:
 * 1. Explicit --vault argument (expands ~ and normalizes separators)
 * 2. Walk upward from cwd looking for .llmwiki/local
 * 3. Walk upward: legacy `.llmwiki/global` or flat `.llmwiki` with a schema markdown file
 * 4. Detect if cwd is INSIDE a vault (wiki schema md at root, or parent does)
 * 5. Fallback: `~/.llmwiki` (or `~/.llmwiki/global` when that legacy vault still exists)
 */
export async function resolveVaultPath(options: VaultOptions, cwd: string): Promise<string> {
  // 1. Explicit path
  if (options.explicitPath) {
    return normalizePath(options.explicitPath, cwd);
  }

  // 2. Walk upward looking for .llmwiki/local
  const localVault = await findUpward(cwd, '.llmwiki/local');
  if (localVault) return localVault;

  // 3. Walk upward: legacy `.../.llmwiki/global` or flat `.../.llmwiki` wiki root
  const globalStyleVault = await findUpwardGlobalStyleVault(cwd);
  if (globalStyleVault) return globalStyleVault;

  // 4. Check if cwd is inside a vault (e.g. under `.llmwiki/`, legacy `.llmwiki/global/`, or `.llmwiki/local/`)
  const vaultFromCwd = await findVaultContaining(cwd);
  if (vaultFromCwd) return vaultFromCwd;

  // 5. Fallback under home (prefers legacy path if that vault already exists)
  return defaultHomeWikiVaultPath();
}

/**
 * Resolve specifically the global vault path.
 * Used by commands that always operate on the global vault (e.g., distill, ingest).
 */
export async function resolveGlobalVaultPath(options: VaultOptions, cwd: string): Promise<string> {
  if (options.explicitPath) {
    return normalizePath(options.explicitPath, cwd);
  }

  return defaultHomeWikiVaultPath();
}

/**
 * Given a path (which may be inside a vault), walk UP until we find a directory
 * that contains a wiki schema markdown file — that's the vault root.
 */
async function findVaultContaining(startPath: string): Promise<string | null> {
  const normalized = resolve(startPath).replace(/\\/g, '/');

  let current = normalized;
  let depth = 0;
  const MAX_DEPTH = 8; // don't walk too far up

  while (depth < MAX_DEPTH) {
    if (basename(current) === '.llmwiki') {
      for (const sub of ['local', 'global']) {
        const subVault = join(current, sub).replace(/\\/g, '/');
        if ((await findExistingVaultSchemaFile(subVault)) !== null) {
          return subVault;
        }
      }
      if ((await findExistingVaultSchemaFile(current)) !== null) {
        return current;
      }
    }

    if ((await findExistingVaultSchemaFile(current)) !== null) {
      return current;
    }

    const parent = dirname(current).replace(/\\/g, '/');
    if (parent === current) break; // reached filesystem root (handles both / and C:\)
    current = parent;
    depth++;
  }

  return null;
}

/**
 * Default wiki vault directory under the user home.
 * If a legacy `~/.llmwiki/global/` vault exists, keep using it; otherwise `~/.llmwiki/`.
 */
export async function defaultHomeWikiVaultPath(): Promise<string> {
  const h = homedir().replace(/\\/g, '/');
  const legacy = `${h}/.llmwiki/global`;
  if ((await findExistingVaultSchemaFile(legacy)) !== null) return legacy;
  return `${h}/.llmwiki`;
}

/**
 * Walk upward from startDir; first match wins:
 * - `<ancestor>/.llmwiki/global` (legacy) with a schema markdown file
 * - `<ancestor>/.llmwiki` (flat) with a schema markdown file at that directory
 */
async function findUpwardGlobalStyleVault(startDir: string): Promise<string | null> {
  let current = resolve(startDir).replace(/\\/g, '/');
  while (true) {
    const legacy = join(current, '.llmwiki', 'global').replace(/\\/g, '/');
    if ((await findExistingVaultSchemaFile(legacy)) !== null) return legacy;
    const flat = join(current, '.llmwiki').replace(/\\/g, '/');
    if ((await findExistingVaultSchemaFile(flat)) !== null) return flat;
    const parent = dirname(current).replace(/\\/g, '/');
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/**
 * Walk upward from startDir looking for a subdirectory named `target`.
 * e.g. findUpward('/home/user/project', '.llmwiki/local')
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

/** True if `vaultPath` contains a recognized wiki schema markdown file. */
export async function findExistingVaultSchemaFile(vaultPath: string): Promise<string | null> {
  for (const name of VAULT_SCHEMA_MARKDOWN_FILENAMES) {
    const p = join(vaultPath, name).replace(/\\/g, '/');
    if (await pathExists(p)) return p;
  }
  return null;
}

/**
 * Pick which schema file to read: preferred agent basename first, then any
 * known schema file in the vault.
 */
export async function resolveVaultSchemaPathForRead(
  vaultPath: string,
  preferredAgent?: string
): Promise<string | null> {
  if (preferredAgent && isKnownAgentId(preferredAgent)) {
    const p = join(vaultPath, vaultSchemaFilenameForAgent(preferredAgent as AgentId)).replace(/\\/g, '/');
    if (await pathExists(p)) return p;
  }
  return findExistingVaultSchemaFile(vaultPath);
}

/**
 * Check if a path looks like a valid vault (has a wiki schema markdown file).
 */
export async function isValidVault(vaultPath: string): Promise<boolean> {
  return (await findExistingVaultSchemaFile(vaultPath)) !== null;
}
