import { resolveVaultPath } from '../core/vault.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { logger } from '../utils/logger.js';
import { readConfig } from '../core/config.js';

export interface SearchOptions {
  query: string;
  scene?: string;
  type?: string;
  engine?: 'ripgrep' | 'qmd' | 'hybrid';
  semantic?: boolean;
  json?: boolean;
  limit?: number;
  vault?: string;
}

interface SearchResult {
  path: string;
  id: string;
  name: string;
  line?: number;
  snippet?: string;
  score?: number;
}

export async function searchCommand(options: SearchOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);
  const engine = options.engine || config.search.defaultEngine;
  const limit = options.limit || 10;
  const wikiDir = `${vault}/wiki`;

  let results: SearchResult[] = [];

  if (engine === 'ripgrep' || engine === 'hybrid') {
    results = await searchRipgrep(wikiDir, options.query, limit);
  }

  if (engine === 'qmd' || engine === 'hybrid') {
    if (await commandExists('qmd')) {
      const qmdResults = await searchQmd(wikiDir, options.query, limit);
      if (engine === 'hybrid') {
        results = mergeResults(results, qmdResults, limit);
      } else {
        results = qmdResults;
      }
    } else {
      logger.warn('qmd not found. Install it with: npm install -g qmd');
      if (engine === 'qmd') {
        logger.info('Falling back to ripgrep');
        results = await searchRipgrep(wikiDir, options.query, limit);
      }
    }
  }

  // Filter by scene/type if specified
  if (options.scene) {
    results = results.filter(r => r.path.includes(`/${options.scene}/`));
  }
  if (options.type) {
    const typeDir = options.type === 'summary' ? 'summaries' :
                    options.type === 'entity' ? 'entities' :
                    options.type === 'concept' ? 'concepts' : 'sources';
    results = results.filter(r => r.path.includes(`/${typeDir}/`));
  }

  if (options.json) {
    console.log(JSON.stringify(results.slice(0, limit), null, 2));
  } else {
    if (results.length === 0) {
      logger.info('No results found.');
      return;
    }
    logger.info(`Found ${results.length} result(s) for "${options.query}":`);
    for (const r of results.slice(0, limit)) {
      console.log(`  ${r.path}`);
      if (r.snippet) {
        console.log(`    ${r.snippet.trim().substring(0, 120)}`);
      }
    }
  }
}

async function searchRipgrep(wikiDir: string, query: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const rgCmd = (await commandExists('rg')) ? 'rg' : 'grep';
    const args = rgCmd === 'rg'
      ? ['-i', '-l', '--max-count', '3', '-g', '*.md', query, wikiDir]
      : ['-r', '-i', '-l', '--include=*.md', query, wikiDir];

    const { stdout } = await runCommand(rgCmd, args);
    const files = stdout.trim().split('\n').filter(Boolean);

    for (const file of files.slice(0, limit)) {
      const id = file.split('/').pop()?.replace('.md', '') || '';
      results.push({ path: file, id, name: id });
    }

    // Get snippets
    if (results.length > 0) {
      try {
        const snippetArgs = rgCmd === 'rg'
          ? ['-i', '-m', '1', '--no-heading', '-g', '*.md', query, wikiDir]
          : ['-r', '-i', '-m', '1', '--include=*.md', query, wikiDir];
        const { stdout: snippetOut } = await runCommand(rgCmd, snippetArgs);
        const snippetLines = snippetOut.trim().split('\n');
        for (const line of snippetLines) {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const filePath = line.substring(0, colonIdx);
            const snippet = line.substring(colonIdx + 1);
            const result = results.find(r => r.path === filePath);
            if (result) result.snippet = snippet;
          }
        }
      } catch { /* ignore snippet errors */ }
    }
  } catch {
    // No results or command failed
  }
  return results;
}

async function searchQmd(wikiDir: string, query: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const { stdout } = await runCommand('qmd', ['search', query, '--dir', wikiDir, '--limit', String(limit)]);
    const lines = stdout.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        results.push({
          path: parsed.path || parsed.file,
          id: (parsed.path || parsed.file || '').split('/').pop()?.replace('.md', '') || '',
          name: parsed.name || parsed.title || '',
          score: parsed.score,
          snippet: parsed.snippet,
        });
      } catch {
        // Not JSON, treat as path
        results.push({ path: line, id: line.split('/').pop()?.replace('.md', '') || '', name: '' });
      }
    }
  } catch {
    // qmd failed
  }
  return results;
}

function mergeResults(a: SearchResult[], b: SearchResult[], limit: number): SearchResult[] {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const r of [...a, ...b]) {
    if (!seen.has(r.path)) {
      seen.add(r.path);
      merged.push(r);
    }
  }
  return merged.slice(0, limit);
}
