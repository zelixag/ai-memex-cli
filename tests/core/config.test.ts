import { describe, it, expect, afterEach } from 'vitest';
import { readConfig } from '../../src/core/config.js';
import { createTempVault, cleanupTempVault, getVaultRoot } from '../helpers.js';

describe('readConfig', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-config-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('should return default config when no config file exists', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const config = await readConfig(vault);
    expect(config.version).toBe('0.1.0');
    expect(config.glob.maxPages).toBe(30);
    expect(config.search.defaultEngine).toBe('ripgrep');
  });

  it('should not crash on non-existent vault path', async () => {
    const config = await readConfig('/nonexistent/vault/path');
    expect(config).toBeDefined();
    expect(config.version).toBe('0.1.0');
  });
});
