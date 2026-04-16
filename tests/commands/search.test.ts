import { describe, it, expect, afterEach } from 'vitest';
import { searchCommand } from '../../src/commands/search.js';
import { createTempVault, cleanupTempVault, getVaultRoot, addWikiPage, addRawFile, captureOutput } from '../helpers.js';

describe('searchCommand', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-search-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('should handle empty query string gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await searchCommand({ query: '', vault: vault }, base);
    });
    const output = stdout + stderr;
    // Should show a helpful message, not crash
    expect(output).toMatch(/empty|usage|query/i);
  });

  it('should handle undefined query gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await searchCommand({ query: undefined as any, vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/empty|usage|query/i);
  });

  it('should find content in wiki pages', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addWikiPage(base, 'research', 'entity', 'react-hooks', `---
name: React Hooks
type: entity
---
# React Hooks
React Hooks are functions that let you use state in functional components.
`);

    const { stdout } = await captureOutput(async () => {
      await searchCommand({ query: 'React Hooks', vault: vault }, base);
    });
    expect(stdout).toContain('react-hooks');
  });

  it('should find content in raw files', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addRawFile(base, 'research', 'typescript-guide.md', `# TypeScript Guide
TypeScript is a typed superset of JavaScript.
`);

    const { stdout } = await captureOutput(async () => {
      await searchCommand({ query: 'TypeScript', vault: vault }, base);
    });
    expect(stdout).toContain('typescript');
  });

  it('should return no results for non-matching query', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await searchCommand({ query: 'xyznonexistent123', vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/no results/i);
  });

  it('should support --json output', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addWikiPage(base, 'research', 'concept', 'graphql', `---
name: GraphQL
type: concept
---
# GraphQL
A query language for APIs.
`);

    const { stdout } = await captureOutput(async () => {
      await searchCommand({ query: 'GraphQL', vault: vault, json: true }, base);
    });
    // JSON output should be parseable
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('should support Chinese search', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addRawFile(base, 'personal', 'notes.md', `# 学习笔记
今天学了React Hooks的使用方法，不能草草了事。
`);

    const { stdout } = await captureOutput(async () => {
      await searchCommand({ query: '草草了事', vault: vault }, base);
    });
    expect(stdout).toContain('notes');
  });
});
