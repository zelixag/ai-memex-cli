/**
 * fetch.ts
 *
 * `memex fetch` — Fetch web content into the vault's raw/ directory.
 *
 * Two modes:
 *   1. Built-in crawler (default) — CLI fetches directly, no agent needed
 *   2. Agent mode (--agent) — delegates to Claude Code / OpenCode / Codex
 *
 * Examples:
 *   memex fetch https://react.dev/reference/react/hooks
 *   memex fetch https://docs.anthropic.com --depth 2 --scene research
 *   memex fetch https://example.com/sitemap.xml --sitemap
 *   memex fetch https://react.dev --agent claude-code
 *   memex fetch https://react.dev --agent opencode
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
import { writeFileUtf8, pathExists, normalizePath } from '../utils/fs.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { logger } from '../utils/logger.js';
import { readConfig } from '../core/config.js';
import { join } from 'node:path';

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
  /** Delegate to agent: claude-code | opencode | codex */
  agent?: string;
  /** Output filename stem (without .md) */
  out?: string;
  /** Aggressive HTML cleaning */
  aggressive?: boolean;
  /** Dry-run: print what would be fetched */
  dryRun?: boolean;
  /** Explicit vault path */
  vault?: string;
}

export async function fetchCommand(
  target: string,
  options: FetchCommandOptions,
  cwd: string
): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const scene = options.scene ?? 'research';
  const rawDir = join(vault, 'raw', scene);

  // ── Agent mode ──────────────────────────────────────────────────────────────
  if (options.agent) {
    await runAgentFetch(target, options, vault, rawDir, cwd);
    return;
  }

  // ── Built-in crawler mode ────────────────────────────────────────────────────
  const crawlOpts: FetchOptions = {
    depth: options.depth ?? 0,
    maxPages: options.maxPages ?? 20,
    include: options.include,
    exclude: options.exclude,
    aggressive: options.aggressive ?? true,
  };

  if (options.dryRun) {
    logger.info(`[dry-run] Would fetch: ${target}`);
    logger.info(`  scene:    ${scene}`);
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
    // Sitemap mode: parse XML, then fetch each URL
    logger.info(`Parsing sitemap: ${target}`);
    const urls = await parseSitemap(target);
    const limit = options.maxPages ?? 20;
    logger.info(`Found ${urls.length} URLs, fetching up to ${limit}...`);
    const subset = urls.slice(0, limit);
    results = await fetchBatch(subset, crawlOpts);
  } else if ((crawlOpts.depth ?? 0) > 0) {
    // Crawl mode
    logger.info(`Crawling ${target} (depth=${crawlOpts.depth}, max=${crawlOpts.maxPages})...`);
    results = await crawlSite(target, crawlOpts);
  } else {
    // Single page
    logger.info(`Fetching ${target}...`);
    const result = await fetchUrl(target, crawlOpts);
    results = [result];
  }

  // Write results to raw/
  const written: string[] = [];
  for (const result of results) {
    const stem = options.out && results.length === 1
      ? options.out
      : slugify(result.url);
    const destPath = join(rawDir, `${stem}.md`);
    const markdown = resultToMarkdown(result);
    await writeFileUtf8(destPath, markdown);
    written.push(destPath);
    logger.info(`  ✓ ${result.title.slice(0, 60)} → ${stem}.md (${result.wordCount} words)`);
  }

  logger.success(`Fetched ${written.length} page(s) to ${rawDir}/`);
  logger.info(`Next: run \`memex ingest\` to process into wiki pages.`);
}

// ── Batch fetch helper ─────────────────────────────────────────────────────────

async function fetchBatch(urls: string[], opts: FetchOptions): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  for (const url of urls) {
    try {
      const r = await fetchUrl(url, opts);
      results.push(r);
      logger.info(`  ✓ ${url}`);
    } catch (e) {
      logger.warn(`  ✗ ${url}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return results;
}

// ── Agent mode ────────────────────────────────────────────────────────────────

async function runAgentFetch(
  target: string,
  options: FetchCommandOptions,
  vault: string,
  rawDir: string,
  cwd: string
): Promise<void> {
  const agentName = options.agent!;
  const agentConfig = AGENT_CONFIGS[agentName];

  if (!agentConfig) {
    logger.error(`Unknown agent: ${agentName}`);
    logger.info(`Supported agents: ${Object.keys(AGENT_CONFIGS).join(', ')}`);
    return;
  }

  const bin = agentConfig.bin;
  if (!(await commandExists(bin))) {
    logger.error(`Agent "${agentName}" not found (command: ${bin})`);
    logger.info(agentConfig.installHint);
    return;
  }

  const prompt = buildAgentFetchPrompt(target, options, rawDir);

  if (options.dryRun) {
    logger.info(`[dry-run] Would run: ${bin} ${agentConfig.promptFlag} "<prompt>"`);
    logger.info('--- Prompt ---');
    console.log(prompt);
    return;
  }

  logger.info(`Delegating fetch to ${agentName}...`);
  const args = agentConfig.buildArgs(prompt);

  try {
    const { stdout, stderr } = await runCommand(bin, args, { cwd });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    logger.success(`Agent fetch complete. Check ${rawDir}/ for results.`);
    logger.info(`Next: run \`memex ingest\` to process into wiki pages.`);
  } catch (e) {
    logger.error(`Agent fetch failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── Agent configurations ───────────────────────────────────────────────────────

interface AgentConfig {
  bin: string;
  promptFlag: string;
  installHint: string;
  buildArgs: (prompt: string) => string[];
}

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'claude-code': {
    bin: 'claude',
    promptFlag: '-p',
    installHint: 'Install: npm install -g @anthropic-ai/claude-code',
    buildArgs: (prompt) => ['-p', prompt, '--allowedTools', 'Bash,Read,Write,WebFetch'],
  },
  'opencode': {
    bin: 'opencode',
    promptFlag: 'run',
    installHint: 'Install: npm install -g opencode-ai',
    buildArgs: (prompt) => ['run', prompt],
  },
  'codex': {
    bin: 'codex',
    promptFlag: '-q',
    installHint: 'Install: npm install -g @openai/codex',
    buildArgs: (prompt) => ['-q', '--approval-mode', 'auto-edit', prompt],
  },
};

// ── Prompt builder for agent mode ─────────────────────────────────────────────

function buildAgentFetchPrompt(
  target: string,
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

URL: ${target}

## Fetch Instructions

${crawlInstructions}
${includeNote}
${excludeNote}

## Output Requirements

For each page you fetch:
1. Use the WebFetch tool (or curl/wget via Bash) to retrieve the page HTML.
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
Examples:
  - https://react.dev/reference/hooks → react-dev-reference-hooks.md
  - https://docs.anthropic.com/claude/overview → anthropic-claude-overview.md

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
