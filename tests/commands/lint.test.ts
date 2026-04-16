import { describe, it, expect, afterEach } from 'vitest';
import { lintCommand } from '../../src/commands/lint.js';
import { createTempVault, cleanupTempVault, getVaultRoot, addWikiPage, captureOutput } from '../helpers.js';

describe('lintCommand', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-lint-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('should report no issues on empty vault', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout, stderr } = await captureOutput(async () => {
      await lintCommand({ vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/no issues/i);
  });

  it('should detect orphan pages', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addWikiPage(base, 'research', 'entity', 'orphan-page', `---
name: Orphan Page
type: entity
scene: research
description: A test orphan page
---
# Orphan Page
This page has no inbound links.
`);

    const { stdout, stderr } = await captureOutput(async () => {
      await lintCommand({ vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('orphan');
  });

  it('should detect broken links', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addWikiPage(base, 'research', 'entity', 'page-with-broken-link', `---
name: Page With Broken Link
type: entity
scene: research
description: A test page
---
# Page With Broken Link
See also [[nonexistent-page]] for more info.
`);

    const { stdout, stderr } = await captureOutput(async () => {
      await lintCommand({ vault: vault }, base);
    });
    const output = stdout + stderr;
    expect(output).toContain('nonexistent-page');
  });

  it('should output JSON when --json flag is set', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const { stdout } = await captureOutput(async () => {
      await lintCommand({ vault: vault, json: true }, base);
    });
    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty('summary');
    expect(parsed.summary).toHaveProperty('orphans');
    expect(parsed.summary).toHaveProperty('brokenLinks');
  });
});
