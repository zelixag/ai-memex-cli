import { resolveVaultPath, resolveVaultSchemaPathForRead } from '../core/vault.js';
import { parseIncludes, resolveIncludePaths } from '../core/injector.js';
import { readFileUtf8, pathExists, listMarkdownFiles } from '../utils/fs.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import { scorePages } from '../core/globber.js';
import { logger } from '../utils/logger.js';
import { readConfig } from '../core/config.js';
import { VAULT_SCHEMA_MARKDOWN_FILENAMES } from '../core/agent-adapter.js';
import { basename } from 'node:path';

export interface InjectOptions {
  task?: string;
  keywords?: string;
  format?: 'md' | 'json';
  maxTokens?: number;
  vault?: string;
}

export async function injectCommand(options: InjectOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);
  const schemaPath = await resolveVaultSchemaPathForRead(vault, config.agent);

  if (!schemaPath) {
    logger.error(
      `No wiki schema file in vault: ${vault} (expected one of: ${VAULT_SCHEMA_MARKDOWN_FILENAMES.join(', ')})`,
    );
    return;
  }

  const agentsContent = await readFileUtf8(schemaPath);
  const schemaLabel = basename(schemaPath);
  const includes = parseIncludes(agentsContent);
  const resolved = resolveIncludePaths(includes, vault);

  const files: string[] = [];

  for (const p of resolved) {
    if (p.includes('*')) {
      // Glob pattern — use manual matching
      const mdFiles = await listMarkdownFiles(vault);
      const globPattern = p.replace(vault + '/', '');
      for (const f of mdFiles) {
        const relative = f.replace(vault + '/', '');
        if (matchGlob(relative, globPattern)) {
          files.push(f);
        }
      }
    } else if (await pathExists(p)) {
      files.push(p);
    }
  }

  // If keywords are provided, also search wiki for relevant pages
  if (options.keywords) {
    const wikiDir = `${vault}/wiki`;
    const index = await buildWikiIndex(wikiDir);
    const keywordList = options.keywords.split(',').map(k => k.trim());
    const scored = scorePages(index.pages, keywordList, 20);
    for (const { page } of scored) {
      if (!files.includes(page.path)) {
        files.push(page.path);
      }
    }
  }

  const uniqueFiles = [...new Set(files)];
  const contents = await Promise.all(
    uniqueFiles.map(async path => {
      const content = await readFileUtf8(path);
      return { path, content };
    })
  );

  if (options.format === 'json') {
    console.log(JSON.stringify(contents, null, 2));
  } else {
    // Output vault schema first (without @include lines)
    const cleanedAgents = agentsContent
      .split('\n')
      .filter(line => !line.match(/^##\s+@include\s+/))
      .join('\n');
    console.log(`<!-- ${schemaLabel} (body only, @include lines stripped) -->\n`);
    console.log(cleanedAgents);
    console.log('\n---\n');

    for (const c of contents) {
      console.log(`\n<!-- BEGIN ${c.path} -->\n`);
      console.log(c.content);
      console.log(`\n<!-- END ${c.path} -->\n`);
    }
  }
}

function matchGlob(path: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(`^${regexStr}$`).test(path);
}
