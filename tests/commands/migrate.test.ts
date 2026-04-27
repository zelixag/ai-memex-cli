import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrateCommand } from '../../src/commands/migrate.js';
import { addWikiPage, captureOutput, cleanupTempVault, createTempVault, getVaultRoot } from '../helpers.js';

const LEGACY_OVERVIEW = `---
name: React State Overview
description: A summary page in legacy schema
type: summary
subtype: overview
scene: research
---

# React State Overview
Legacy summary content.
`;

const LEGACY_COMPARISON = `---
name: Redux vs Zustand
description: Side-by-side comparison
type: summary
subtype: comparison
scene: research
---

# Redux vs Zustand
`;

const LEGACY_INVALID_SUBTYPE = `---
name: Bad Page
description: Has summary type but no valid subtype
type: summary
scene: research
---

# Bad Page
`;

const NEW_SCHEMA_PAGE = `---
name: TypeScript
description: Already migrated
type: entity
scene: research
---

# TypeScript
`;

describe('migrateCommand --from-summary-subtype', () => {
  const vaults: string[] = [];

  function makeVault(): string {
    const v = createTempVault(`-migrate-${Math.random().toString(36).slice(2)}`);
    vaults.push(v);
    return v;
  }

  afterEach(() => {
    vaults.forEach(cleanupTempVault);
    vaults.length = 0;
  });

  it('moves summary+subtype:overview to overviews/ and rewrites frontmatter', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const oldPath = addWikiPage(base, 'research', 'summarie', 'react-state', LEGACY_OVERVIEW);
    // ↑ addWikiPage appends 's' to the type, so 'summarie' → 'summaries/'
    expect(existsSync(oldPath)).toBe(true);

    await captureOutput(async () => {
      await migrateCommand({ fromSummarySubtype: true, vault }, base);
    });

    const newPath = join(vault, 'wiki', 'research', 'overviews', 'react-state.md');
    expect(existsSync(newPath)).toBe(true);
    expect(existsSync(oldPath)).toBe(false);

    const content = readFileSync(newPath, 'utf-8');
    expect(content).toMatch(/type:\s*overview/);
    expect(content).not.toMatch(/subtype:/);
  });

  it('moves summary+subtype:comparison to comparisons/', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    addWikiPage(base, 'research', 'summarie', 'redux-vs-zustand', LEGACY_COMPARISON);

    await captureOutput(async () => {
      await migrateCommand({ fromSummarySubtype: true, vault }, base);
    });

    const newPath = join(vault, 'wiki', 'research', 'comparisons', 'redux-vs-zustand.md');
    expect(existsSync(newPath)).toBe(true);
    const content = readFileSync(newPath, 'utf-8');
    expect(content).toMatch(/type:\s*comparison/);
  });

  it('--dry-run does not touch files', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const oldPath = addWikiPage(base, 'research', 'summarie', 'react-state', LEGACY_OVERVIEW);

    await captureOutput(async () => {
      await migrateCommand({ fromSummarySubtype: true, dryRun: true, vault }, base);
    });

    expect(existsSync(oldPath)).toBe(true);
    const content = readFileSync(oldPath, 'utf-8');
    expect(content).toMatch(/type:\s*summary/);
    expect(content).toMatch(/subtype:\s*overview/);
    const newPath = join(vault, 'wiki', 'research', 'overviews', 'react-state.md');
    expect(existsSync(newPath)).toBe(false);
  });

  it('skips pages where type:summary has no valid subtype', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const oldPath = addWikiPage(base, 'research', 'summarie', 'bad-page', LEGACY_INVALID_SUBTYPE);

    const result = await migrateCommand({ fromSummarySubtype: true, vault }, base);
    expect(result.skipped.length).toBe(1);
    expect(result.migrated.length).toBe(0);
    expect(existsSync(oldPath)).toBe(true);
  });

  it('leaves new-schema pages untouched', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const path = addWikiPage(base, 'research', 'entitie', 'typescript', NEW_SCHEMA_PAGE);

    await captureOutput(async () => {
      await migrateCommand({ fromSummarySubtype: true, vault }, base);
    });

    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toMatch(/type:\s*entity/);
  });

  it('reports a conflict when destination already exists', async () => {
    const base = makeVault();
    const vault = getVaultRoot(base);
    const oldPath = addWikiPage(base, 'research', 'summarie', 'react-state', LEGACY_OVERVIEW);
    addWikiPage(base, 'research', 'overview', 'react-state', NEW_SCHEMA_PAGE);

    const result = await migrateCommand({ fromSummarySubtype: true, vault }, base);
    expect(result.conflicts.length).toBe(1);
    expect(result.migrated.length).toBe(0);
    expect(existsSync(oldPath)).toBe(true);
  });
});
