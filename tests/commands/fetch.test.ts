import { describe, it, expect, afterEach } from 'vitest';
import { fetchCommand } from '../../src/commands/fetch.js';
import { createTempVault, cleanupTempVault, getVaultRoot, captureOutput } from '../helpers.js';

describe('fetchCommand', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-fetch-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('should handle missing URL gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('', { vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/url|required|provide/i);
  });

  it('should handle undefined URL gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand(undefined as any, { vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/url|required|provide/i);
  });

  it('should handle invalid URL gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('not-a-url', { vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/invalid|url|http/i);
  });

  it('should show plan in dry-run mode', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('https://example.com', { vault: vault, dryRun: true }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('example.com');
  });
});
