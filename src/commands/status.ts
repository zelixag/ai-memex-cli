import { resolveVaultPath } from '../core/vault.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import { findOrphans } from '../core/linker.js';
import { listMarkdownFiles } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export interface StatusOptions {
  vault?: string;
}

export async function statusCommand(options: StatusOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const rawFiles = await listMarkdownFiles(`${vault}/raw`);
  const wikiIndex = await buildWikiIndex(`${vault}/wiki`);
  const orphans = findOrphans(wikiIndex.pages);

  // Group by scene
  const byScene: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const page of wikiIndex.pages) {
    byScene[page.scene] = (byScene[page.scene] || 0) + 1;
    byType[page.type] = (byType[page.type] || 0) + 1;
  }

  logger.info(`Vault: ${vault}`);
  logger.info(`Raw files pending: ${rawFiles.length}`);
  logger.info(`Wiki pages: ${wikiIndex.pages.length}`);
  logger.info(`Orphan pages: ${orphans.length}`);

  if (Object.keys(byScene).length > 0) {
    logger.info('By scene:');
    for (const [scene, count] of Object.entries(byScene)) {
      logger.info(`  ${scene}: ${count}`);
    }
  }

  if (Object.keys(byType).length > 0) {
    logger.info('By type:');
    for (const [type, count] of Object.entries(byType)) {
      logger.info(`  ${type}: ${count}`);
    }
  }
}
