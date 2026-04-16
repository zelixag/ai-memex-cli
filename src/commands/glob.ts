import { resolveGlobalVaultPath } from '../core/vault.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import { scorePages, extractKeywords } from '../core/globber.js';
import { writeFileUtf8, readFileUtf8, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { readConfig } from '../core/config.js';
import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface GlobOptions {
  project: string;
  into?: string;
  keywords?: string;
  max?: number;
  vault?: string;
}

export async function globCommand(options: GlobOptions, cwd: string): Promise<void> {
  const globalVault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const projectDir = resolve(cwd, options.project);
  const localVault = options.into || `${projectDir}/.llmwiki/local`;
  const config = await readConfig(globalVault);

  const keywordList = options.keywords
    ? options.keywords.split(',').map(k => k.trim())
    : await extractKeywords(projectDir);

  if (keywordList.length === 0) {
    logger.warn('No keywords detected. Use --keywords to specify manually.');
    return;
  }

  const max = options.max || config.glob.maxPages;
  const wikiDir = `${globalVault}/wiki`;
  const index = await buildWikiIndex(wikiDir);

  if (index.pages.length === 0) {
    logger.warn('Global wiki is empty. Ingest some sources first.');
    return;
  }

  const scored = scorePages(index.pages, keywordList, max);

  if (scored.length === 0) {
    logger.warn(`No pages matched keywords: ${keywordList.join(', ')}`);
    return;
  }

  for (const { page } of scored) {
    const relativePath = page.path.replace(wikiDir + '/', '').replace(wikiDir + '\\', '');
    const destPath = `${localVault}/wiki/${relativePath}`;
    await writeFileUtf8(destPath, ''); // ensure directory exists
    await cp(page.path, destPath, { force: true });
  }

  // Generate local AGENTS.md with @include directives
  const includes = scored.map(({ page }) => {
    const relativePath = page.path.replace(wikiDir + '/', '').replace(wikiDir + '\\', '');
    return `## @include ./wiki/${relativePath}`;
  }).join('\n');

  const agentsContent = `---
name: Project Wiki
description: Auto-generated local vault for ${projectDir}
---

# Project Wiki

## Globbed Pages (${scored.length})

Keywords: ${keywordList.join(', ')}

${includes}
`;

  await writeFileUtf8(`${localVault}/AGENTS.md`, agentsContent);
  logger.success(`Globbed ${scored.length} pages into ${localVault}/wiki`);
  logger.info(`Keywords used: ${keywordList.join(', ')}`);
}
