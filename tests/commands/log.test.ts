import { describe, it, expect, afterEach } from 'vitest';
import { logCommand } from '../../src/commands/log.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTempVault, cleanupTempVault, getVaultRoot, captureOutput } from '../helpers.js';

describe('logCommand', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-log-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('should append a log entry', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    await logCommand({
      action: 'ingest',
      target: 'react-docs',
      vault: vault,
    }, base);

    const logContent = readFileSync(join(vault, 'log.md'), 'utf-8');
    expect(logContent).toContain('ingest');
    expect(logContent).toContain('react-docs');
  });

  it('should append with --note', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    await logCommand({
      action: 'ingest',
      target: 'react-docs',
      note: 'Added from official docs',
      vault: vault,
    }, base);

    const logContent = readFileSync(join(vault, 'log.md'), 'utf-8');
    expect(logContent).toContain('Added from official docs');
  });

  it('should handle missing action gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    // Should not crash
    const { stderr } = await captureOutput(async () => {
      await logCommand({
        action: '',
        target: 'something',
        vault: vault,
      }, base);
    });
  });

  it('should handle missing target gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stderr } = await captureOutput(async () => {
      await logCommand({
        action: 'ingest',
        target: '',
        vault: vault,
      }, base);
    });
  });
});
