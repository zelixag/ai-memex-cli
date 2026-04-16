import { describe, it, expect } from 'vitest';
import { resolveVaultPath } from '../../src/core/vault.js';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('resolveVaultPath', () => {
  it('returns explicit path when provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vault-'));
    await mkdir(join(dir, '.llmwiki', 'global'), { recursive: true });
    await writeFile(join(dir, '.llmwiki', 'global', 'AGENTS.md'), '');
    const result = await resolveVaultPath({ explicitPath: join(dir, '.llmwiki', 'global') }, dir);
    expect(result).toBe(join(dir, '.llmwiki', 'global').replace(/\\/g, '/'));
  });

  it('finds local vault upward', async () => {
    const root = await mkdtemp(join(tmpdir(), 'proj-'));
    await mkdir(join(root, '.llmwiki', 'local'), { recursive: true });
    const sub = join(root, 'src', 'deep');
    await mkdir(sub, { recursive: true });
    const result = await resolveVaultPath({}, sub);
    expect(result).toBe(join(root, '.llmwiki', 'local').replace(/\\/g, '/'));
  });

  it('finds global vault upward', async () => {
    const root = await mkdtemp(join(tmpdir(), 'proj-'));
    await mkdir(join(root, '.llmwiki', 'global'), { recursive: true });
    const sub = join(root, 'src');
    await mkdir(sub, { recursive: true });
    const result = await resolveVaultPath({}, sub);
    expect(result).toBe(join(root, '.llmwiki', 'global').replace(/\\/g, '/'));
  });

  it('falls back to ~/.llmwiki/global', async () => {
    const sub = await mkdtemp(join(tmpdir(), 'empty-'));
    const result = await resolveVaultPath({}, sub);
    const home = process.env.HOME || process.env.USERPROFILE;
    expect(result).toBe(`${home?.replace(/\\/g, '/')}/.llmwiki/global`);
  });
});
