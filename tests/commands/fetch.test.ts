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

  it('should handle missing target gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('', { vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/target.*required|url.*required|usage/i);
  });

  it('should handle undefined target gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand(undefined as any, { vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/target.*required|url.*required|usage/i);
  });

  it('should detect URL and show plan in dry-run mode', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('https://example.com', { vault: vault, dryRun: true }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('example.com');
    expect(output).toContain('dry-run');
  });

  it('should detect keyword and show search plan in dry-run mode', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('react hooks best practices', { vault: vault, dryRun: true }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('dry-run');
    expect(output).toContain('react hooks best practices');
  });

  it('should detect domain-like input as URL', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('react.dev', { vault: vault, dryRun: true }, base);
    });
    const output = stdout + stderr;
    // Should be treated as URL, not keyword
    expect(output).toContain('react.dev');
    expect(output).toMatch(/fetch|single-page/i);
  });

  it('should show agent search plan in dry-run mode with --agent', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await fetchCommand('Kubernetes deployment', {
        vault: vault,
        dryRun: true,
        agent: 'claude-code',
      }, base);
    });
    const output = stdout + stderr;
    // Either shows dry-run plan or agent-not-found (both are valid in test env)
    expect(output).toMatch(/dry-run|not found|not installed/i);
  });
});
