import { resolveVaultPath } from '../core/vault.js';
import { pluralizeType } from '../core/schema.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { listMarkdownFiles, readFileUtf8, pathExists } from '../utils/fs.js';
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
  /** Search raw/ in addition to wiki/ (default: true) */
  includeRaw?: boolean;
  vault?: string;
}

interface SearchResult {
  path: string;
  id: string;
  name: string;
  dir: 'wiki' | 'raw';
  line?: number;
  snippet?: string;
  score?: number;
}

export async function searchCommand(options: SearchOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);
  const engine = options.engine || config.search.defaultEngine;
  const limit = options.limit || 10;
  const query = (options.query ?? '').trim();

  // ── Guard: empty query ────────────────────────────────────────────────────
  if (!query) {
    logger.warn('Search query is empty. Usage: memex search "<query>"');
    logger.info('Example: memex search "React Hooks"');
    return;
  }

  // ── Determine search directories ──────────────────────────────────────────
  const wikiDir = `${vault}/wiki`;
  const rawDir = `${vault}/raw`;
  const includeRaw = options.includeRaw !== false; // default true

  const dirsToSearch: Array<{ dir: string; label: 'wiki' | 'raw' }> = [];
  if (await pathExists(wikiDir)) dirsToSearch.push({ dir: wikiDir, label: 'wiki' });
  if (includeRaw && (await pathExists(rawDir))) dirsToSearch.push({ dir: rawDir, label: 'raw' });

  if (dirsToSearch.length === 0) {
    logger.warn(`Vault is empty. Run \`memex init\` first.`);
    return;
  }

  // ── Run search across all directories ────────────────────────────────────
  let results: SearchResult[] = [];

  for (const { dir, label } of dirsToSearch) {
    let dirResults: SearchResult[] = [];

    if (engine === 'ripgrep' || engine === 'hybrid') {
      dirResults = await searchRipgrep(dir, query, limit, label);
    }

    if (engine === 'qmd' || engine === 'hybrid') {
      if (await commandExists('qmd')) {
        const qmdResults = await searchQmd(dir, query, limit, label);
        if (engine === 'hybrid') {
          dirResults = mergeResults(dirResults, qmdResults, limit);
        } else {
          dirResults = qmdResults;
        }
      } else if (engine === 'qmd') {
        logger.warn('qmd not found. Falling back to ripgrep.');
        dirResults = await searchRipgrep(dir, query, limit, label);
      }
    }

    results.push(...dirResults);
  }

  // ── Filter by scene / type ────────────────────────────────────────────────
  if (options.scene) {
    results = results.filter(r => r.path.includes(`/${options.scene}/`));
  }
  if (options.type) {
    const typeDir = pluralizeType(options.type);
    results = results.filter(r => r.path.includes(`/${typeDir}/`));
  }

  // Deduplicate and cap
  const seen = new Set<string>();
  const unique = results.filter(r => {
    if (seen.has(r.path)) return false;
    seen.add(r.path);
    return true;
  }).slice(0, limit);

  // ── Output ────────────────────────────────────────────────────────────────
  if (options.json) {
    console.log(JSON.stringify(unique, null, 2));
    return;
  }

  if (unique.length === 0) {
    logger.info(`No results found for "${query}".`);
    logger.info(`Searched in: ${dirsToSearch.map(d => d.dir).join(', ')}`);
    return;
  }

  logger.info(`Found ${unique.length} result(s) for "${query}":\n`);
  for (const r of unique) {
    const label = r.dir === 'raw' ? ' [raw]' : ' [wiki]';
    const name = r.name || r.id;
    console.log(`  \x1b[36m${name}\x1b[0m\x1b[2m${label}\x1b[0m`);
    console.log(`  \x1b[2m${r.path}\x1b[0m`);
    if (r.snippet) {
      const clean = r.snippet.trim().replace(/\s+/g, ' ').substring(0, 160);
      console.log(`  \x1b[33m↳\x1b[0m ${clean}`);
    }
    console.log();
  }
}

// ── ripgrep / grep backend ────────────────────────────────────────────────────

async function searchRipgrep(
  dir: string,
  query: string,
  limit: number,
  label: 'wiki' | 'raw'
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const hasRg = await commandExists('rg');
    const rgCmd = hasRg ? 'rg' : 'grep';

    // Step 1: get matching file list
    const listArgs = hasRg
      ? ['-i', '-l', '-g', '*.md', '--', query, dir]
      : ['-r', '-i', '-l', '--include=*.md', query, dir];

    const { stdout } = await runCommand(rgCmd, listArgs);
    const files = stdout.trim().split('\n').filter(Boolean).slice(0, limit);

    if (files.length === 0) return results;

    // Step 2: get one snippet per file
    const snippetMap = new Map<string, string>();
    try {
      const snippetArgs = hasRg
        ? ['-i', '-m', '1', '--no-heading', '-g', '*.md', '--', query, dir]
        : ['-r', '-i', '-m', '1', '--include=*.md', query, dir];

      const { stdout: snippetOut } = await runCommand(rgCmd, snippetArgs);
      for (const line of snippetOut.trim().split('\n')) {
        // format: /path/to/file.md:matched line content
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const filePath = line.substring(0, colonIdx);
          const snippet = line.substring(colonIdx + 1).trim();
          if (!snippetMap.has(filePath)) {
            snippetMap.set(filePath, snippet);
          }
        }
      }
    } catch { /* snippet fetch failed — not critical */ }

    for (const file of files) {
      const parts = file.split('/');
      const filename = parts[parts.length - 1] ?? '';
      const id = filename.replace(/\.md$/, '');
      // Try to get a better name from frontmatter title line
      let name = id;
      try {
        const content = await readFileUtf8(file);
        const titleMatch = content.match(/^name:\s*(.+)$/m) || content.match(/^title:\s*["']?(.+?)["']?$/m);
        if (titleMatch) name = titleMatch[1].trim();
      } catch { /* ignore */ }

      results.push({
        path: file,
        id,
        name,
        dir: label,
        snippet: snippetMap.get(file),
      });
    }
  } catch {
    // No results or command failed
  }
  return results;
}

// ── qmd backend ───────────────────────────────────────────────────────────────

async function searchQmd(
  dir: string,
  query: string,
  limit: number,
  label: 'wiki' | 'raw'
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const { stdout } = await runCommand('qmd', ['search', query, '--dir', dir, '--limit', String(limit)]);
    for (const line of stdout.trim().split('\n').filter(Boolean)) {
      try {
        const parsed = JSON.parse(line);
        const filePath = parsed.path || parsed.file || '';
        results.push({
          path: filePath,
          id: filePath.split('/').pop()?.replace('.md', '') || '',
          name: parsed.name || parsed.title || '',
          dir: label,
          score: parsed.score,
          snippet: parsed.snippet,
        });
      } catch {
        results.push({
          path: line,
          id: line.split('/').pop()?.replace('.md', '') || '',
          name: '',
          dir: label,
        });
      }
    }
  } catch { /* qmd failed */ }
  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
