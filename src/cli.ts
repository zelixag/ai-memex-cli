#!/usr/bin/env node
import { cac } from 'cac';
import { initCommand } from './commands/init.js';
import { distillCommand } from './commands/distill.js';
import { ingestCommand } from './commands/ingest.js';
import { watchCommand } from './commands/watch.js';
import { globCommand } from './commands/glob.js';
import { injectCommand } from './commands/inject.js';
import { lintCommand } from './commands/lint.js';
import { searchCommand } from './commands/search.js';
import { newCommand } from './commands/new.js';
import { logCommand } from './commands/log.js';
import { installHooksCommand } from './commands/install-hooks.js';
import { statusCommand } from './commands/status.js';
import { linkCheckCommand } from './commands/link-check.js';
import { fetchCommand } from './commands/fetch.js';

const cli = cac('memex');

cli.command('init [path]', 'Initialize a vault')
  .option('--scope <scope>', 'global or local', { default: 'global' })
  .option('--scene <scene>', 'Comma-separated scenes')
  .action(async (path: string | undefined, options: Record<string, unknown>) => {
    await initCommand({ scope: options.scope as 'global' | 'local', scene: options.scene as string | undefined, path }, process.cwd());
  });

cli.command('distill <input>', 'Distill session JSONL to raw markdown')
  .option('--out <out>', 'Output path')
  .option('--no-llm', 'Use mechanical extraction only')
  .option('--vault <vault>', 'Vault path')
  .action(async (input: string, options: Record<string, unknown>) => {
    await distillCommand({ input, out: options.out as string | undefined, noLlm: !options.llm, vault: options.vault as string | undefined }, process.cwd());
  });

cli.command('ingest <target>', 'Ingest a raw file into wiki (shells to agent)')
  .option('--no-llm', 'Skip LLM agent')
  .option('--dry-run', 'Print prompt only')
  .option('--vault <vault>', 'Vault path')
  .action(async (target: string, options: Record<string, unknown>) => {
    await ingestCommand({ target, noLlm: !options.llm, dryRun: options.dryRun as boolean | undefined, vault: options.vault as string | undefined }, process.cwd());
  });

cli.command('watch', 'Watch raw/ for changes and auto-ingest')
  .option('--path <path>', 'Path to watch')
  .option('--daemon', 'Run as background process')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    await watchCommand({ path: options.path as string | undefined, daemon: options.daemon as boolean | undefined, vault: options.vault as string | undefined }, process.cwd());
  });

cli.command('glob', 'Project relevant wiki pages into local vault')
  .option('--project <project>', 'Project directory', { default: '.' })
  .option('--into <into>', 'Local vault destination')
  .option('--keywords <keywords>', 'Comma-separated keywords')
  .option('--max <max>', 'Max pages', { default: 30 })
  .option('--vault <vault>', 'Global vault path')
  .action(async (options: Record<string, unknown>) => {
    await globCommand({
      project: options.project as string,
      into: options.into as string | undefined,
      keywords: options.keywords as string | undefined,
      max: Number(options.max),
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.command('inject', 'Output wiki context for agent consumption')
  .option('--task <task>', 'Task description')
  .option('--keywords <keywords>', 'Comma-separated keywords')
  .option('--format <format>', 'md or json', { default: 'md' })
  .option('--max-tokens <max>', 'Token limit')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    await injectCommand({
      task: options.task as string | undefined,
      keywords: options.keywords as string | undefined,
      format: options.format as 'md' | 'json',
      maxTokens: options.maxTokens ? Number(options.maxTokens) : undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.command('lint', 'Health-check the wiki')
  .option('--scene <scene>', 'Filter by scene')
  .option('--check <check>', 'Comma-separated checks')
  .option('--json', 'Output JSON')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    await lintCommand({
      scene: options.scene as string | undefined,
      check: options.check as string | undefined,
      json: options.json as boolean | undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.command('search <query>', 'Search wiki pages')
  .option('--scene <scene>', 'Filter by scene')
  .option('--type <type>', 'Filter by type')
  .option('--engine <engine>', 'ripgrep, qmd, or hybrid')
  .option('--semantic', 'Use semantic search')
  .option('--json', 'Output JSON')
  .option('--limit <limit>', 'Result limit', { default: 10 })
  .option('--vault <vault>', 'Vault path')
  .action(async (query: string, options: Record<string, unknown>) => {
    await searchCommand({
      query,
      scene: options.scene as string | undefined,
      type: options.type as string | undefined,
      engine: options.engine as 'ripgrep' | 'qmd' | 'hybrid' | undefined,
      semantic: options.semantic as boolean | undefined,
      json: options.json as boolean | undefined,
      limit: Number(options.limit),
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.command('new <type> <name>', 'Scaffold a new wiki page')
  .option('--scene <scene>', 'Scene', { default: 'research' })
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--vault <vault>', 'Vault path')
  .action(async (type: string, name: string, options: Record<string, unknown>) => {
    await newCommand({
      type: type as any,
      name,
      scene: options.scene as any,
      tags: (options.tags as string)?.split(','),
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.command('log <action>', 'Append an entry to log.md')
  .option('--target <target>', 'Target page')
  .option('--note <note>', 'Note text')
  .option('--vault <vault>', 'Vault path')
  .action(async (action: string, options: Record<string, unknown>) => {
    await logCommand({
      action,
      target: options.target as string | undefined,
      note: options.note as string | undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.command('install-hooks', 'Install agent hooks')
  .option('--agent <agent>', 'Agent type', { default: 'claude-code' })
  .option('--events <events>', 'Comma-separated events')
  .option('--dry-run', 'Print without writing')
  .action(async (options: Record<string, unknown>) => {
    await installHooksCommand({
      agent: options.agent as string,
      events: options.events as string | undefined,
      dryRun: options.dryRun as boolean | undefined,
    }, process.cwd());
  });

cli.command('status', 'Show vault overview')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    await statusCommand({ vault: options.vault as string | undefined }, process.cwd());
  });

cli.command('link-check', 'Validate wiki links')
  .option('--fix', 'Suggest fixes')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    await linkCheckCommand({
      fix: options.fix as boolean | undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.command('fetch <url>', 'Fetch web content into raw/ directory')
  .option('--scene <scene>', 'Scene: personal/research/reading/team', { default: 'research' })
  .option('--depth <depth>', 'Crawl depth (0=single page)', { default: 0 })
  .option('--max-pages <max>', 'Max pages to fetch', { default: 20 })
  .option('--sitemap', 'Treat URL as sitemap.xml')
  .option('--include <pattern>', 'Only follow links matching regex pattern')
  .option('--exclude <pattern>', 'Skip links matching regex pattern')
  .option('--agent <agent>', 'Delegate to agent: claude-code | opencode | codex')
  .option('--out <name>', 'Output filename stem (single page only)')
  .option('--aggressive', 'Aggressive HTML cleaning', { default: true })
  .option('--dry-run', 'Print what would be fetched without doing it')
  .option('--vault <vault>', 'Vault path')
  .action(async (url: string, options: Record<string, unknown>) => {
    await fetchCommand(url, {
      scene: options.scene as any,
      depth: Number(options.depth),
      maxPages: Number(options.maxPages),
      sitemap: options.sitemap as boolean | undefined,
      include: options.include as string | undefined,
      exclude: options.exclude as string | undefined,
      agent: options.agent as string | undefined,
      out: options.out as string | undefined,
      aggressive: options.aggressive as boolean | undefined,
      dryRun: options.dryRun as boolean | undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

cli.help();
cli.version('0.1.0');

cli.parse();
