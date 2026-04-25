import { mkdir, readFile, writeFile, access, readdir } from 'node:fs/promises';
import { dirname, join, isAbsolute, resolve, normalize } from 'node:path';
import { homedir } from 'node:os';

// ── Cross-platform path utilities ─────────────────────────────────────────────

/**
 * Expand leading ~ to the user's home directory.
 * Works on Windows, macOS, and Linux.
 *
 * Examples:
 *   "~/.llmwiki"  → "/home/user/.llmwiki"
 *   "~\\.llmwiki" → "C:\\Users\\user\\.llmwiki"  (Windows)
 */
export function expandHome(p: string): string {
  if (!p) return p;
  // Handle both ~ and ~\ and ~/
  if (p === '~') return homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

/**
 * Normalize a path for the current platform:
 * 1. Expand ~ to home directory
 * 2. Normalize separators (backslash → forward slash on all platforms)
 * 3. Resolve relative paths against cwd
 *
 * Always returns a POSIX-style string with forward slashes.
 */
export function normalizePath(p: string, cwd?: string): string {
  if (!p) return (cwd ?? process.cwd()).replace(/\\/g, '/');

  // Step 1: convert ALL backslashes to forward slashes first
  // This handles Windows paths like ~\.llmwiki\global or C:\Users\...
  let normalized = p.replace(/\\/g, '/');

  // Step 2: expand ~ (now safe since backslashes are gone)
  normalized = expandHome(normalized);

  // Step 3: resolve relative paths against cwd
  if (!isAbsolute(normalized)) {
    normalized = resolve(cwd ?? process.cwd(), normalized).replace(/\\/g, '/');
  }

  // Step 4: normalize (remove ./ ../ double slashes etc.)
  return normalize(normalized).replace(/\\/g, '/');
}

/**
 * Default wiki vault raw directory path (flat layout under home).
 * Cross-platform: ~/.llmwiki/raw
 */
export function defaultRawDir(): string {
  return join(homedir(), '.llmwiki', 'raw').replace(/\\/g, '/');
}

/**
 * Default wiki vault root under home (flat layout).
 * Cross-platform: ~/.llmwiki
 */
export function defaultGlobalVault(): string {
  return join(homedir(), '.llmwiki').replace(/\\/g, '/');
}

// ── File I/O utilities ────────────────────────────────────────────────────────

export async function readFileUtf8(path: string): Promise<string> {
  return readFile(normalizePath(path), 'utf-8');
}

export async function writeFileUtf8(path: string, content: string): Promise<void> {
  const normalized = normalizePath(path);
  await mkdir(dirname(normalized), { recursive: true });
  await writeFile(normalized, content, 'utf-8');
}

export async function appendFileUtf8(path: string, content: string): Promise<void> {
  const existing = (await pathExists(path)) ? await readFileUtf8(path) : '';
  await writeFileUtf8(path, existing + content);
}

export async function pathExists(path: string): Promise<boolean> {
  if (!path && path !== '.') return false;
  try {
    await access(normalizePath(path));
    return true;
  } catch {
    return false;
  }
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  const normalized = normalizePath(dir);
  if (!(await pathExists(normalized))) return [];
  const results: string[] = [];
  await walkDir(normalized, results);
  return results.sort();
}

async function walkDir(dir: string, results: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      await walkDir(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== '.gitkeep') {
      results.push(fullPath);
    }
  }
}
