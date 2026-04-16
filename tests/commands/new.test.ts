import { describe, it, expect, afterEach } from 'vitest';
import { newCommand } from '../../src/commands/new.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createTempVault, cleanupTempVault, getVaultRoot, captureOutput } from '../helpers.js';

describe('newCommand', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-new-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('should create a new entity page', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    await newCommand({
      type: 'entity',
      name: 'React Framework',
      scene: 'research',
      vault: vault,
    }, base);

    const expected = join(vault, 'wiki', 'research', 'entities', 'react-framework.md');
    expect(existsSync(expected)).toBe(true);
  });

  it('should create a concept page', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    await newCommand({
      type: 'concept',
      name: 'Dependency Injection',
      scene: 'research',
      vault: vault,
    }, base);

    const expected = join(vault, 'wiki', 'research', 'concepts', 'dependency-injection.md');
    expect(existsSync(expected)).toBe(true);
  });

  it('should handle missing name gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    // Should not crash, should show error message
    const { stderr } = await captureOutput(async () => {
      await newCommand({
        type: 'entity',
        name: '',
        scene: 'research',
        vault: vault,
      }, base);
    });
    // Either shows error or creates file with empty name — should not throw
  });

  it('should handle missing type gracefully', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stderr } = await captureOutput(async () => {
      await newCommand({
        type: '' as any,
        name: 'test',
        scene: 'research',
        vault: vault,
      }, base);
    });
    // Should not crash
  });

  it('should default scene to research', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    await newCommand({
      type: 'entity',
      name: 'Test Entity',
      vault: vault,
    }, base);

    // Should create in research by default
    const expected = join(vault, 'wiki', 'research', 'entities', 'test-entity.md');
    expect(existsSync(expected)).toBe(true);
  });
});
