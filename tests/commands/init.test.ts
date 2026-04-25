import { describe, it, expect, afterEach } from 'vitest';
import { initCommand } from '../../src/commands/init.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createTempVault, cleanupTempVault } from '../helpers.js';
import { mkdirSync, rmSync } from 'node:fs';

describe('initCommand', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = join(process.cwd(), '.test-vaults', `init-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const d of tempDirs) {
      try { rmSync(d, { recursive: true, force: true }); } catch {}
    }
    tempDirs.length = 0;
  });

  it('should create global vault structure with CLAUDE.md for claude-code', async () => {
    const dir = makeTempDir();
    await initCommand({ scope: 'global', agent: 'claude-code' }, dir);

    const vaultRoot = join(dir, '.llmwiki');
    expect(existsSync(join(vaultRoot, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(vaultRoot, 'index.md'))).toBe(true);
    expect(existsSync(join(vaultRoot, 'log.md'))).toBe(true);
    expect(existsSync(join(vaultRoot, 'raw'))).toBe(true);
    expect(existsSync(join(vaultRoot, 'wiki'))).toBe(true);
  });

  it('should create local vault structure', async () => {
    const dir = makeTempDir();
    await initCommand({ scope: 'local' }, dir);

    const vaultRoot = join(dir, '.llmwiki', 'local');
    expect(existsSync(join(vaultRoot, 'AGENTS.md'))).toBe(true);
  });

  it('should not crash when vault already exists', async () => {
    const dir = makeTempDir();
    await initCommand({ scope: 'global', agent: 'claude-code' }, dir);
    // Second init should not throw
    await expect(initCommand({ scope: 'global', agent: 'claude-code' }, dir)).resolves.not.toThrow();
  });

  it('should create AGENTS.md for codex global vault', async () => {
    const dir = makeTempDir();
    await initCommand({ scope: 'global', agent: 'codex' }, dir);
    const vaultRoot = join(dir, '.llmwiki');
    expect(existsSync(join(vaultRoot, 'AGENTS.md'))).toBe(true);
  });
});
