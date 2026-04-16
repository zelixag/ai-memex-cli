import { describe, it, expect, afterEach } from 'vitest';
import { statusCommand } from '../../src/commands/status.js';
import { createTempVault, cleanupTempVault, getVaultRoot, addWikiPage, addRawFile, captureOutput } from '../helpers.js';

describe('statusCommand', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-status-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('should show zero counts on empty vault', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await statusCommand({ vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('0');
  });

  it('should count raw files', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addRawFile(base, 'research', 'doc1.md', '# Doc 1');
    addRawFile(base, 'research', 'doc2.md', '# Doc 2');

    const { stdout, stderr } = await captureOutput(async () => {
      await statusCommand({ vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('2');
  });

  it('should count wiki pages', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addWikiPage(base, 'research', 'entity', 'page1', '---\nname: Page1\ntype: entity\nscene: research\ndescription: test\n---\n# Page1');
    addWikiPage(base, 'research', 'concept', 'page2', '---\nname: Page2\ntype: concept\nscene: research\ndescription: test\n---\n# Page2');

    const { stdout, stderr } = await captureOutput(async () => {
      await statusCommand({ vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('2');
  });

  it('should output JSON when --json flag is set', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout } = await captureOutput(async () => {
      await statusCommand({ vault: vault, json: true }, base);
    });
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('rawFiles');
    expect(parsed).toHaveProperty('wikiPages');
  });
});
