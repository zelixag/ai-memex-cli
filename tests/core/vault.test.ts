import { describe, it, expect } from 'vitest';
import { resolveGlobalVaultPath, resolveVaultPath } from '../../src/core/vault.js';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

describe('resolveVaultPath', () => {
  it('returns explicit path when provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vault-'));
    await mkdir(join(dir, '.llmwiki'), { recursive: true });
    await writeFile(join(dir, '.llmwiki', 'AGENTS.md'), '');
    const result = await resolveVaultPath({ explicitPath: join(dir, '.llmwiki') }, dir);
    expect(result).toBe(join(dir, '.llmwiki').replace(/\\/g, '/'));
  });

  it('finds local vault upward', async () => {
    const root = await mkdtemp(join(tmpdir(), 'proj-'));
    await mkdir(join(root, '.llmwiki', 'local'), { recursive: true });
    const sub = join(root, 'src', 'deep');
    await mkdir(sub, { recursive: true });
    const result = await resolveVaultPath({}, sub);
    expect(result).toBe(join(root, '.llmwiki', 'local').replace(/\\/g, '/'));
  });

  it('finds legacy global vault upward', async () => {
    const root = await mkdtemp(join(tmpdir(), 'proj-'));
    await mkdir(join(root, '.llmwiki', 'global'), { recursive: true });
    await writeFile(join(root, '.llmwiki', 'global', 'AGENTS.md'), '');
    const sub = join(root, 'src');
    await mkdir(sub, { recursive: true });
    const result = await resolveVaultPath({}, sub);
    expect(result).toBe(join(root, '.llmwiki', 'global').replace(/\\/g, '/'));
  });

  it('finds flat wiki vault upward', async () => {
    const root = await mkdtemp(join(tmpdir(), 'proj-'));
    await mkdir(join(root, '.llmwiki'), { recursive: true });
    await writeFile(join(root, '.llmwiki', 'AGENTS.md'), '');
    const sub = join(root, 'pkg', 'nested');
    await mkdir(sub, { recursive: true });
    const result = await resolveVaultPath({}, sub);
    expect(result).toBe(join(root, '.llmwiki').replace(/\\/g, '/'));
  });

  it('finds flat wiki vault with CLAUDE.md only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'proj-'));
    await mkdir(join(root, '.llmwiki'), { recursive: true });
    await writeFile(join(root, '.llmwiki', 'CLAUDE.md'), '---\nname: x\n---\n');
    const sub = join(root, 'src');
    await mkdir(sub, { recursive: true });
    const result = await resolveVaultPath({}, sub);
    expect(result).toBe(join(root, '.llmwiki').replace(/\\/g, '/'));
  });

  it('falls back to ~/.llmwiki or legacy ~/.llmwiki/global', async () => {
    const sub = await mkdtemp(join(tmpdir(), 'empty-'));
    const result = await resolveVaultPath({}, sub);
    const home = homedir().replace(/\\/g, '/');
    expect([`${home}/.llmwiki`, `${home}/.llmwiki/global`]).toContain(result);
  });
});

describe('resolveGlobalVaultPath', () => {
  it('defaults to home global vault instead of treating a project AGENTS.md as the global vault', async () => {
    const project = await mkdtemp(join(tmpdir(), 'project-with-agents-'));
    await writeFile(join(project, 'AGENTS.md'), '# Project instructions\n');

    const result = await resolveGlobalVaultPath({}, project);
    const home = homedir().replace(/\\/g, '/');

    expect(result).not.toBe(project.replace(/\\/g, '/'));
    expect([`${home}/.llmwiki`, `${home}/.llmwiki/global`]).toContain(result);
  });
});
