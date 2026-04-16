import { resolveVaultPath } from '../core/vault.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import { findBrokenLinks } from '../core/linker.js';
import { logger } from '../utils/logger.js';

export interface LinkCheckOptions {
  fix?: boolean;
  vault?: string;
}

export async function linkCheckCommand(options: LinkCheckOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const index = await buildWikiIndex(`${vault}/wiki`);
  const broken = findBrokenLinks(index.pages);

  if (broken.length === 0) {
    logger.success('All links are valid.');
    return;
  }

  logger.info(`Found ${broken.length} broken link(s):`);
  for (const b of broken) {
    logger.warn(`  ${b.source} → [[${b.target}]]`);
  }

  if (options.fix && broken.length) {
    logger.info('Auto-fix not implemented in MVP. Agent should resolve these manually.');
  }
}
