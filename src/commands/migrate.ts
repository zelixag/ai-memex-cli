import { rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { resolveVaultPath } from '../core/vault.js';
import { listMarkdownFiles, pathExists, readFileUtf8, writeFileUtf8 } from '../utils/fs.js';
import { parseFrontmatter, stringifyFrontmatter, pluralizeType, type WikiType } from '../core/schema.js';
import { logger } from '../utils/logger.js';

export interface MigrateOptions {
  fromSummarySubtype?: boolean;
  dryRun?: boolean;
  vault?: string;
}

export interface MigrateResult {
  migrated: { from: string; to: string }[];
  skipped: { path: string; reason: string }[];
  conflicts: { from: string; to: string }[];
}

const VALID_SUBTYPES: ReadonlySet<WikiType> = new Set(['comparison', 'overview', 'synthesis']);
const LEGACY_DIR_NAMES = new Set(['summaries', 'summary']);

export async function migrateCommand(options: MigrateOptions, cwd: string): Promise<MigrateResult> {
  if (!options.fromSummarySubtype) {
    logger.error('No migration selected. Currently supported: --from-summary-subtype');
    return { migrated: [], skipped: [], conflicts: [] };
  }

  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const wikiDir = `${vault}/wiki`;

  if (!(await pathExists(wikiDir))) {
    logger.warn(`Wiki directory not found: ${wikiDir}`);
    return { migrated: [], skipped: [], conflicts: [] };
  }

  return runFromSummarySubtype(wikiDir, Boolean(options.dryRun));
}

async function runFromSummarySubtype(wikiDir: string, dryRun: boolean): Promise<MigrateResult> {
  const files = await listMarkdownFiles(wikiDir);
  const result: MigrateResult = { migrated: [], skipped: [], conflicts: [] };

  for (const file of files) {
    const content = await readFileUtf8(file);
    const { data, body } = parseFrontmatter(content);

    const rawType = (data as Record<string, unknown>).type;
    if (rawType !== 'summary') continue;

    const subtype = (data as Record<string, unknown>).subtype;
    if (typeof subtype !== 'string' || !VALID_SUBTYPES.has(subtype as WikiType)) {
      result.skipped.push({
        path: file,
        reason: `type: summary but subtype is missing or invalid (got: ${String(subtype)})`,
      });
      continue;
    }

    const newType = subtype as WikiType;
    const newDir = pluralizeType(newType);
    const dir = dirname(file).replace(/\\/g, '/');
    const dirLeaf = dir.split('/').pop() ?? '';
    const fileName = file.split('/').pop() as string;

    let target = file;
    if (LEGACY_DIR_NAMES.has(dirLeaf)) {
      const parent = dir.slice(0, dir.length - dirLeaf.length - 1);
      target = `${parent}/${newDir}/${fileName}`;
    }

    if (target !== file && (await pathExists(target))) {
      result.conflicts.push({ from: file, to: target });
      continue;
    }

    const newData: Record<string, unknown> = { ...data, type: newType };
    delete newData.subtype;
    const newContent = stringifyFrontmatter(newData, body);

    if (dryRun) {
      result.migrated.push({ from: file, to: target });
      continue;
    }

    if (target === file) {
      await writeFileUtf8(file, newContent);
    } else {
      await writeFileUtf8(target, newContent);
      await rm(file);
      const oldDirPath = dirname(file);
      try {
        const remaining = await listMarkdownFiles(oldDirPath);
        if (remaining.length === 0) await rm(oldDirPath, { recursive: true, force: true });
      } catch {
        /* leave parent dir alone if cleanup fails */
      }
    }

    result.migrated.push({ from: file, to: target });
  }

  printSummary(result, dryRun);
  return result;
}

function printSummary(result: MigrateResult, dryRun: boolean): void {
  const verb = dryRun ? 'Would migrate' : 'Migrated';
  if (result.migrated.length === 0 && result.skipped.length === 0 && result.conflicts.length === 0) {
    logger.success('No legacy summary+subtype pages found — nothing to migrate.');
    return;
  }

  logger.success(`${verb} ${result.migrated.length} page(s)`);
  for (const { from, to } of result.migrated) {
    if (from === to) console.log(`    ${from}  (in-place: dropped subtype)`);
    else console.log(`    ${from}\n      → ${to}`);
  }

  if (result.conflicts.length > 0) {
    logger.warn(`${result.conflicts.length} conflict(s) — destination already exists, skipped:`);
    for (const { from, to } of result.conflicts) console.log(`    ${from}\n      ✗ ${to} exists`);
  }

  if (result.skipped.length > 0) {
    logger.warn(`${result.skipped.length} skipped:`);
    for (const { path, reason } of result.skipped) console.log(`    ${path}  (${reason})`);
  }

  if (dryRun) logger.info('Dry-run only — no files were changed. Re-run without --dry-run to apply.');
}
