/**
 * fetch.ts
 *
 * `memex fetch` — Fetch web content into the vault's raw/ directory.
 *
 * Three modes:
 *   1. URL mode (default) — direct URL, CLI fetches it
 *   2. Search mode — fuzzy keyword, CLI searches web → shows results → fetches selected
 *   3. Agent mode (--agent) — delegates to Agent for search + fetch
 *
 * Examples:
 *   # Direct URL
 *   memex fetch https://react.dev/reference/react/hooks
 *
 *   # Keyword search (CLI searches, you pick)
 *   memex fetch "react hooks best practices"
 *   memex fetch "Kubernetes 部署最佳实践" --top 5
 *   memex fetch "rust async runtime" --yes          # auto-fetch top result
 *
 *   # Agent search + fetch (agent does everything)
 *   memex fetch "react server components" --agent claude-code
 *   memex fetch "OAuth2 PKCE flow" --agent codex --top 3
 *
 *   # Crawl mode
 *   memex fetch https://docs.anthropic.com --depth 2 --scene research
 *   memex fetch https://example.com/sitemap.xml --sitemap
 */

import { resolveGlobalVaultPath } from '../core/vault.js';
import {
  fetchUrl,
  crawlSite,
  parseSitemap,
  resultToMarkdown,
  slugify,
  type FetchOptions,
  type FetchResult,
} from '../core/fetcher.js';
import { webSearch, isUrl, normalizeUrl, type SearchResult } from '../core/searcher.js';
import { writeFileUtf8, normalizePath } from '../utils/fs.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { createProgressBar, createSpinner } from '../utils/progress.js';
import { logger } from '../utils/logger.js';
import { resolveAgent, buildAgentArgs, type AgentId } from '../core/agent-adapter.js';
import { readConfig } from '../core/config.js';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

export interface FetchCommandOptions {
  /** Scene to file under: personal/research/reading/team */
  scene?: 'personal' | 'research' | 'reading' | 'team';
  /** Crawl depth (0 = single page) */
  depth?: number;
  /** Max pages in crawl/sitemap mode */
  maxPages?: number;
  /** Treat URL as sitemap.xml */
  sitemap?: boolean;
  /** Only follow links matching this regex pattern */
  include?: string;
  /** Skip links matching this regex pattern */
  exclude?: string;
  /** Delegate to agent */
  agent?: string;
  /** Output filename stem (without .md) */
  out?: string;
  /** Aggressive HTML cleaning */
  aggressive?: boolean;
  /** Dry-run: print what would be fetched */
  dryRun?: boolean;
  /** Explicit vault path */
  vault?: string;
  /** How many search results to show / fetch */
  top?: number;
  /** Auto-confirm: skip interactive selection, fetch top results */
  yes?: boolean;
}

export async function fetchCommand(
  target: string,
  options: FetchCommandOptions,
  cwd: string
): Promise<void> {
  // ── Input validation ──────────────────────────────────────────────────────
  if (!target || typeof target !== 'string' || !target.trim()) {
    logger.error('Target is required. Usage: memex fetch <url-or-keywords>');
    logger.info('');
    logger.info('Examples:');
    logger.info('  memex fetch https://react.dev/reference/react/hooks');
    logger.info('  memex fetch "react hooks best practices"');
    logger.info('  memex fetch "Kubernetes 部署" --agent claude-code');
    return;
  }

  const trimmedTarget = target.trim();
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const scene = options.scene ?? 'research';
  const rawDir = join(vault, 'raw', scene);

  // ── Detect mode: URL vs keyword search ────────────────────────────────────
  if (isUrl(trimmedTarget)) {
    // URL mode — existing behavior
    const normalizedUrl = normalizeUrl(trimmedTarget);
    if (options.agent) {
      await runAgentFetch(normalizedUrl, options, vault, rawDir, cwd);
    } else {
      await runDirectFetch(normalizedUrl, options, rawDir);
    }
  } else {
    // Keyword search mode
    if (options.agent) {
      await runAgentSearch(trimmedTarget, options, vault, rawDir, cwd);
    } else {
      await runKeywordSearch(trimmedTarget, options, rawDir);
    }
  }
}

// ── Keyword Search Mode (CLI built-in) ──────────────────────────────────────

async function runKeywordSearch(
  query: string,
  options: FetchCommandOptions,
  rawDir: string
): Promise<void> {
  const topN = options.top ?? 5;

  logger.info(`Searching the web for: "${query}" ...`);

  if (options.dryRun) {
    logger.info(`[dry-run] Would search for: "${query}"`);
    logger.info(`  top:    ${topN} results`);
    logger.info(`  scene:  ${options.scene ?? 'research'}`);
    logger.info(`  output: ${rawDir}/`);
    logger.info(`  auto:   ${options.yes ? 'yes (fetch all)' : 'no (interactive)'}`);
    return;
  }

  let results: SearchResult[];
  try {
    results = await webSearch(query, topN);
  } catch (e) {
    logger.error(`Web search failed: ${e instanceof Error ? e.message : String(e)}`);
    logger.info('Tip: Try using --agent to delegate search to your AI agent.');
    logger.info('     memex fetch "your query" --agent claude-code');
    return;
  }

  if (results.length === 0) {
    logger.warn('No search results found.');
    logger.info('Try different keywords or use --agent for AI-powered search.');
    return;
  }

  // Display results
  logger.info(`\nFound ${results.length} result(s):\n`);
  results.forEach((r, i) => {
    console.log(`  \x1b[36m[${i + 1}]\x1b[0m ${r.title}`);
    console.log(`      \x1b[2m${r.url}\x1b[0m`);
    if (r.snippet) {
      console.log(`      ${r.snippet.slice(0, 120)}`);
    }
    console.log();
  });

  // Select which to fetch
  let selectedIndices: number[];

  if (options.yes) {
    // Auto mode: fetch all results
    selectedIndices = results.map((_, i) => i);
    logger.info(`Auto-fetching all ${results.length} result(s)...`);
  } else {
    // Interactive mode: ask user
    const answer = await askUser(
      `Which results to fetch? (e.g. 1,3,5 or "all" or "none") [all]: `
    );
    const trimmed = answer.trim().toLowerCase();

    if (trimmed === 'none' || trimmed === 'n' || trimmed === 'q') {
      logger.info('Cancelled.');
      return;
    } else if (trimmed === '' || trimmed === 'all' || trimmed === 'a') {
      selectedIndices = results.map((_, i) => i);
    } else {
      selectedIndices = trimmed
        .split(/[,\s]+/)
        .map((s) => parseInt(s, 10) - 1)
        .filter((n) => !isNaN(n) && n >= 0 && n < results.length);

      if (selectedIndices.length === 0) {
        logger.warn('No valid selection. Cancelled.');
        return;
      }
    }
  }

  // Fetch selected URLs
  const selected = selectedIndices.map((i) => results[i]);
  logger.info(`Fetching ${selected.length} page(s)...`);

  const fetchOpts: FetchOptions = {
    depth: 0,
    aggressive: options.aggressive ?? true,
  };

  const written: string[] = [];
  const failures: string[] = [];
  const bar = createProgressBar(selected.length, '抓取页面');
  for (const result of selected) {
    try {
      const fetched = await fetchUrl(result.url, fetchOpts);
      const stem = slugify(result.url);
      const destPath = join(rawDir, `${stem}.md`);
      const markdown = resultToMarkdown(fetched);
      await writeFileUtf8(destPath, markdown);
      written.push(destPath);
      bar.tick(fetched.title.slice(0, 40) || result.url);
    } catch (e) {
      failures.push(`${result.url}: ${e instanceof Error ? e.message : String(e)}`);
      bar.tick(`(fail) ${result.url.slice(0, 40)}`);
    }
  }
  bar.done(
    `Fetched ${written.length}/${selected.length} page(s) to ${rawDir}/${failures.length ? `，失败 ${failures.length}` : ''}`
  );
  for (const f of failures) logger.warn(`  ✗ ${f}`);

  if (written.length > 0) {
    logger.info('Next: run `memex ingest` to process into wiki pages.');
  } else {
    logger.warn('No pages were successfully fetched.');
  }
}

// ── Direct URL Fetch (existing behavior) ────────────────────────────────────

async function runDirectFetch(
  url: string,
  options: FetchCommandOptions,
  rawDir: string
): Promise<void> {
  const crawlOpts: FetchOptions = {
    depth: options.depth ?? 0,
    maxPages: options.maxPages ?? 20,
    include: options.include,
    exclude: options.exclude,
    aggressive: options.aggressive ?? true,
  };

  if (options.dryRun) {
    logger.info(`[dry-run] Would fetch: ${url}`);
    logger.info(`  scene:    ${options.scene ?? 'research'}`);
    logger.info(`  depth:    ${crawlOpts.depth}`);
    logger.info(`  maxPages: ${crawlOpts.maxPages}`);
    logger.info(`  output:   ${rawDir}/`);
    if (options.sitemap) logger.info('  mode: sitemap');
    else if ((crawlOpts.depth ?? 0) > 0) logger.info('  mode: crawl');
    else logger.info('  mode: single-page');
    return;
  }

  let results: FetchResult[] = [];

  if (options.sitemap) {
    const spinner = createSpinner(`解析 sitemap：${url}`);
    try {
      const urls = await parseSitemap(url);
      const limit = options.maxPages ?? 20;
      spinner.stop(`sitemap 含 ${urls.length} 条，开始抓取前 ${limit} 条`, 'info');
      const subset = urls.slice(0, limit);
      results = await fetchBatch(subset, crawlOpts);
    } catch (e) {
      spinner.stop(`sitemap 解析失败：${e instanceof Error ? e.message : String(e)}`, 'err');
      return;
    }
  } else if ((crawlOpts.depth ?? 0) > 0) {
    const spinner = createSpinner(
      `抓取 ${url} (depth=${crawlOpts.depth}, max=${crawlOpts.maxPages})`
    );
    try {
      results = await crawlSite(url, crawlOpts);
      spinner.stop(`抓取完成：${results.length} 个页面`, 'ok');
    } catch (e) {
      spinner.stop(`抓取失败：${e instanceof Error ? e.message : String(e)}`, 'err');
      return;
    }
  } else {
    const spinner = createSpinner(`抓取 ${url}`);
    try {
      const result = await fetchUrl(url, crawlOpts);
      results = [result];
      spinner.stop(`已抓取：${result.title.slice(0, 60)}`, 'ok');
    } catch (e) {
      spinner.stop(`抓取失败：${e instanceof Error ? e.message : String(e)}`, 'err');
      return;
    }
  }

  const written: string[] = [];
  const bar = createProgressBar(results.length, '写入 markdown');
  for (const result of results) {
    const stem = options.out && results.length === 1
      ? options.out
      : slugify(result.url);
    const destPath = join(rawDir, `${stem}.md`);
    const markdown = resultToMarkdown(result);
    await writeFileUtf8(destPath, markdown);
    written.push(destPath);
    bar.tick(result.title.slice(0, 40) || result.url);
  }
  bar.done(`已写入 ${written.length} 个页面到 ${rawDir}/`);
  logger.info('Next: run `memex ingest` to process into wiki pages.');
}

// ── Agent Search + Fetch Mode ───────────────────────────────────────────────

async function runAgentSearch(
  query: string,
  options: FetchCommandOptions,
  vault: string,
  rawDir: string,
  cwd: string
): Promise<void> {
  const config = await readConfig(vault);
  const agentId = (options.agent === 'true' || options.agent === '')
    ? (config as any).agent ?? 'claude-code'
    : options.agent!;

  const resolved = await resolveAgent(agentId);
  if (!resolved) {
    logger.error(`Agent "${agentId}" not found or not installed.`);
    logger.info('Run `memex config agents` to see available agents.');
    return;
  }

  const topN = options.top ?? 5;
  const prompt = buildAgentSearchPrompt(query, options, rawDir, topN);

  if (options.dryRun) {
    logger.info(`[dry-run] Would delegate search to ${resolved.id}:`);
    logger.info(`  query: "${query}"`);
    logger.info(`  top:   ${topN}`);
    logger.info(`  scene: ${options.scene ?? 'research'}`);
    logger.info('--- Agent Prompt ---');
    console.log(prompt);
    return;
  }

  logger.info(`  Query: "${query}"`);
  logger.info(`  Top ${topN} results → ${rawDir}/`);

  const args = buildAgentArgs(resolved.profile, resolved.resolvedBin, prompt);
  const spinner = createSpinner(`正在调用 ${resolved.profile.name} 搜索并抓取…`);

  try {
    const { stdout, stderr } = await runCommand(resolved.resolvedBin, args, { cwd });
    spinner.stop(`Agent search + fetch complete. Check ${rawDir}/ for results.`, 'ok');
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    logger.info('Next: run `memex ingest` to process into wiki pages.');
  } catch (e) {
    spinner.stop(`Agent failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
  }
}

// ── Agent Direct URL Fetch Mode ─────────────────────────────────────────────

async function runAgentFetch(
  url: string,
  options: FetchCommandOptions,
  vault: string,
  rawDir: string,
  cwd: string
): Promise<void> {
  const config = await readConfig(vault);
  const agentId = (options.agent === 'true' || options.agent === '')
    ? (config as any).agent ?? 'claude-code'
    : options.agent!;

  const resolved = await resolveAgent(agentId);
  if (!resolved) {
    logger.error(`Agent "${agentId}" not found or not installed.`);
    logger.info('Run `memex config agents` to see available agents.');
    return;
  }

  const prompt = buildAgentFetchPrompt(url, options, rawDir);

  if (options.dryRun) {
    logger.info(`[dry-run] Would delegate fetch to ${resolved.id}:`);
    logger.info('--- Agent Prompt ---');
    console.log(prompt);
    return;
  }

  const args = buildAgentArgs(resolved.profile, resolved.resolvedBin, prompt);
  const spinner = createSpinner(`正在调用 ${resolved.profile.name} 抓取…`);

  try {
    const { stdout, stderr } = await runCommand(resolved.resolvedBin, args, { cwd });
    spinner.stop(`Agent fetch complete. Check ${rawDir}/ for results.`, 'ok');
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    logger.info('Next: run `memex ingest` to process into wiki pages.');
  } catch (e) {
    spinner.stop(`Agent fetch failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
  }
}

// ── Batch fetch helper ─────────────────────────────────────────────────────────

async function fetchBatch(urls: string[], opts: FetchOptions): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  const failures: string[] = [];
  const bar = createProgressBar(urls.length, '批量抓取');
  for (const url of urls) {
    try {
      const r = await fetchUrl(url, opts);
      results.push(r);
      bar.tick(url);
    } catch (e) {
      failures.push(`${url}: ${e instanceof Error ? e.message : String(e)}`);
      bar.tick(`(fail) ${url}`);
    }
  }
  bar.done(`批量抓取完成：${results.length}/${urls.length}${failures.length ? `，失败 ${failures.length}` : ''}`);
  for (const f of failures) logger.warn(`  ✗ ${f}`);
  return results;
}

// ── Interactive prompt helper ───────────────────────────────────────────────

function askUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ── Prompt builders ─────────────────────────────────────────────────────────

function buildAgentSearchPrompt(
  query: string,
  options: FetchCommandOptions,
  rawDir: string,
  topN: number
): string {
  const scene = options.scene ?? 'research';

  return `You are a research assistant. Your task is to search the web for relevant documentation and save it to the memex vault.

## Search Query

"${query}"

## Instructions

1. Search the web for the query above. Use WebFetch, Bash (curl), or any available web tool.
2. Find the top ${topN} most relevant, high-quality pages (prefer official docs, authoritative blogs, well-known sources).
3. For each page:
   a. Fetch the full page content.
   b. Extract the main article content — strip navigation, headers, footers, ads, sidebars.
   c. Convert to clean Markdown.
   d. Save to: ${rawDir}/<slug>.md

## Output Format

Each file MUST have this YAML frontmatter:
\`\`\`yaml
---
title: "<page title>"
source-url: <exact URL fetched>
fetched: <ISO 8601 timestamp>
word-count: <approximate word count>
search-query: "${query}"
---
\`\`\`

## Naming Convention

Filename slug: lowercase, hyphens, max 80 chars, derived from URL path or page title.

## Scene

All files go into: ${rawDir}/
Scene: ${scene}

## Quality Rules

- Prefer official documentation over blog posts
- Prefer recent content over outdated content
- Preserve code blocks with correct language tags
- Keep headings hierarchy (h1 → h2 → h3)
- If a page is inaccessible, skip it and try the next result
- Do NOT modify any existing files in the vault

After saving all files, output a summary:
- Total pages fetched
- List of saved filenames with titles
- Any pages that failed with reason
`;
}

function buildAgentFetchPrompt(
  url: string,
  options: FetchCommandOptions,
  rawDir: string
): string {
  const scene = options.scene ?? 'research';
  const depth = options.depth ?? 0;
  const maxPages = options.maxPages ?? 20;
  const isSitemap = options.sitemap ?? false;

  const crawlInstructions = isSitemap
    ? `The URL is a sitemap.xml. Parse it to discover all page URLs, then fetch up to ${maxPages} pages.`
    : depth > 0
    ? `Crawl the site recursively up to depth ${depth}, fetching up to ${maxPages} pages. Stay on the same domain.`
    : `Fetch only this single page.`;

  const includeNote = options.include
    ? `Only follow links matching this pattern: ${options.include}`
    : '';
  const excludeNote = options.exclude
    ? `Skip links matching this pattern: ${options.exclude}`
    : '';

  return `You are a web content fetcher. Your task is to fetch web content and save it to the memex vault.

## Target

URL: ${url}

## Fetch Instructions

${crawlInstructions}
${includeNote}
${excludeNote}

## Output Requirements

For each page you fetch:
1. Use WebFetch or Bash (curl/wget) to retrieve the page.
2. Extract the main article content — strip navigation, headers, footers, ads, and sidebars.
3. Convert the content to clean Markdown.
4. Save to: ${rawDir}/<slug>.md

Each file MUST have this YAML frontmatter:
\`\`\`yaml
---
title: "<page title>"
source-url: <exact URL fetched>
fetched: <ISO 8601 timestamp>
word-count: <approximate word count>
---
\`\`\`

## Naming Convention

Filename slug: lowercase, hyphens, max 80 chars, derived from URL path or page title.

## Scene

All files go into: ${rawDir}/
Scene: ${scene}

## Quality Rules

- Preserve code blocks with correct language tags
- Keep headings hierarchy (h1 → h2 → h3)
- Keep internal links as plain text or remove them
- If a page returns 404 or is inaccessible, skip it and log a warning
- Do NOT modify any existing files in the vault

After saving all files, output a summary:
- Total pages fetched
- List of saved filenames
- Any pages that failed with reason
`;
}
