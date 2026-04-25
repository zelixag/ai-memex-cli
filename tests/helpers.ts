/**
 * Test helpers — shared utilities for command and core tests
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Create a temporary vault directory for testing.
 * Returns the base path. Caller should call `cleanupTempVault(path)` after.
 */
export function createTempVault(suffix = ''): string {
  const base = join(process.cwd(), '.test-vaults', `vault-${Date.now()}${suffix}`);
  const vaultRoot = join(base, '.llmwiki');

  mkdirSync(join(vaultRoot, 'raw', 'research'), { recursive: true });
  mkdirSync(join(vaultRoot, 'raw', 'personal'), { recursive: true });
  mkdirSync(join(vaultRoot, 'raw', 'sessions'), { recursive: true });
  mkdirSync(join(vaultRoot, 'wiki', 'research', 'entities'), { recursive: true });
  mkdirSync(join(vaultRoot, 'wiki', 'research', 'concepts'), { recursive: true });
  mkdirSync(join(vaultRoot, 'wiki', 'research', 'sources'), { recursive: true });
  mkdirSync(join(vaultRoot, 'wiki', 'research', 'summaries'), { recursive: true });

  writeFileSync(join(vaultRoot, 'AGENTS.md'), `---
name: Test Wiki
description: Test vault for unit tests
---
# Test Wiki Schema
`);

  writeFileSync(join(vaultRoot, 'index.md'), `# LLM Wiki Index
> Last updated: 2026-01-01
`);

  writeFileSync(join(vaultRoot, 'log.md'), `# LLM Wiki Log
`);

  return base;
}

/**
 * Add a wiki page to a temp vault
 */
export function addWikiPage(
  base: string,
  scene: string,
  type: string,
  slug: string,
  content: string
): string {
  const vaultRoot = join(base, '.llmwiki');
  const dir = join(vaultRoot, 'wiki', scene, `${type}s`);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${slug}.md`);
  writeFileSync(filePath, content);
  return filePath;
}

/**
 * Add a raw file to a temp vault
 */
export function addRawFile(
  base: string,
  scene: string,
  filename: string,
  content: string
): string {
  const vaultRoot = join(base, '.llmwiki');
  const dir = join(vaultRoot, 'raw', scene);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, filename);
  writeFileSync(filePath, content);
  return filePath;
}

/**
 * Clean up a temp vault directory
 */
export function cleanupTempVault(base: string): void {
  try {
    if (existsSync(base)) {
      rmSync(base, { recursive: true, force: true });
    }
  } catch {
    // ignore cleanup errors
  }
}

/**
 * Get the vault root (`<base>/.llmwiki`, flat layout) from a base path
 */
export function getVaultRoot(base: string): string {
  return join(base, '.llmwiki');
}

/**
 * Capture ALL output from a function call.
 * Intercepts console.log, console.error, process.stdout.write, process.stderr.write
 * to capture everything including logger output and raw console.log calls.
 */
export async function captureOutput(fn: () => Promise<void>): Promise<{
  stdout: string;
  stderr: string;
}> {
  let stdout = '';
  let stderr = '';

  // Save originals
  const origStdoutWrite = process.stdout.write;
  const origStderrWrite = process.stderr.write;
  const origLog = console.log;
  const origError = console.error;
  const origWarn = console.warn;

  // Intercept process.stdout.write
  process.stdout.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
    return true;
  }) as typeof process.stdout.write;

  // Intercept process.stderr.write
  process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    stderr += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
    return true;
  }) as typeof process.stderr.write;

  // Also intercept console methods (they call process.stdout/stderr.write internally,
  // but some environments may buffer differently)
  console.log = (...args: unknown[]) => {
    stdout += args.map(String).join(' ') + '\n';
  };
  console.error = (...args: unknown[]) => {
    stderr += args.map(String).join(' ') + '\n';
  };
  console.warn = (...args: unknown[]) => {
    stderr += args.map(String).join(' ') + '\n';
  };

  try {
    await fn();
  } finally {
    // Restore originals
    process.stdout.write = origStdoutWrite;
    process.stderr.write = origStderrWrite;
    console.log = origLog;
    console.error = origError;
    console.warn = origWarn;
  }

  return { stdout, stderr };
}
