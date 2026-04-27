#!/usr/bin/env node
import { cac } from 'cac';
import { initCommand } from './commands/init.js';
import { distillCommand, type DistillOptions } from './commands/distill.js';
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
import { configCommand } from './commands/config.js';
import { onboardCommand } from './commands/onboard.js';
import { updateCommand } from './commands/update.js';
import { contextCommand } from './commands/context.js';
import { migrateCommand } from './commands/migrate.js';
import { getPackageVersion } from './version.js';
import { ensureVault, ensureAgent } from './core/prereqs.js';
import { logger } from './utils/logger.js';
import { parseCliWithFriendlyErrors } from './cli-parse-guard.js';

const cli = cac('memex');

// ── Onboarding ───────────────────────────────────────────────────────────────

cli.command('onboard', 'Interactive setup wizard — choose agent, configure vault & hooks')
  .option('--agent <agent>', 'Pre-select agent (skip prompt)')
  .option('-y, --yes', 'Accept all defaults (non-interactive)')
  .example('memex onboard')
  .example('memex onboard --agent claude-code -y')
  .action(async (options: Record<string, unknown>) => {
    await onboardCommand({
      agent: options.agent as string | undefined,
      yes: options.yes as boolean | undefined,
    }, process.cwd());
  });

// ── Vault management ──────────────────────────────────────────────────────────

cli.command('init [path]', 'Initialize a vault')
  .option('--scope <scope>', 'global or local', { default: 'global' })
  .option('--scene <scene>', 'Comma-separated scenes')
  .option(
    '--agent <id>',
    'For global vault: wiki schema filename (e.g. claude-code → CLAUDE.md); defaults from ~/.llmwiki/config.json',
  )
  .action(async (path: string | undefined, options: Record<string, unknown>) => {
    await initCommand(
      {
        scope: options.scope as 'global' | 'local',
        scene: options.scene as string | undefined,
        path,
        agent: options.agent as string | undefined,
      },
      process.cwd(),
    );
  });

cli.command('status', 'Show vault overview')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await statusCommand({ vault }, process.cwd());
  });

// ── Configuration ─────────────────────────────────────────────────────────────

// cac does not support space-separated subcommand names like 'config set'.
// We use a single 'config' command with variadic args and parse them manually.
cli.command('config [...args]', 'Manage configuration  (list | set <key> <val> | get <key> | agents)')
  .option('--global', 'Write to global config (~/.llmwiki/config.json)')
  .option('--local', 'Write to local vault config')
  .option('--vault <vault>', 'Vault path')
  .example('memex config agents                   # list all supported agents')
  .example('memex config set agent claude-code     # set fallback agent')
  .example('memex config set agent codex')
  .example('memex config set agent opencode')
  .example('memex config set agent gemini-cli')
  .example('memex config get agent')
  .example('memex config list')
  .action(async (args: string[], options: Record<string, unknown>) => {
    const [sub, key, value] = args ?? [];
    const subcommand = (sub ?? 'list') as 'list' | 'get' | 'set' | 'agents';
    await configCommand({
      subcommand,
      key,
      value,
      global: options.global as boolean | undefined,
      local: options.local as boolean | undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

// ── Content acquisition ───────────────────────────────────────────────────────

cli.command('fetch <target>', 'Fetch web content or search keywords into raw/')
  .option('--scene <scene>', 'Scene: personal/research/reading/team', { default: 'research' })
  .option('--depth <depth>', 'Crawl depth (0=single page)', { default: 0 })
  .option('--max-pages <max>', 'Max pages to fetch', { default: 20 })
  .option('--top <top>', 'Number of search results to show/fetch', { default: 5 })
  .option('-y, --yes', 'Auto-confirm: skip selection, fetch top results')
  .option('--sitemap', 'Treat URL as sitemap.xml')
  .option('--include <pattern>', 'Only follow links matching regex pattern')
  .option('--exclude <pattern>', 'Skip links matching regex pattern')
  .option('--agent <agent>', 'Delegate to agent: claude-code | opencode | codex | gemini-cli')
  .option('--out <name>', 'Output filename stem (single page only)')
  .option('--dry-run', 'Print what would be fetched without doing it')
  .option('--aggressive', 'Aggressive HTML cleaning', { default: true })
  .option('--vault <vault>', 'Vault path')
  .example('memex fetch https://react.dev/reference/react/hooks')
  .example('memex fetch "react hooks best practices"')
  .example('memex fetch "Kubernetes 部署最佳实践" --top 3')
  .example('memex fetch "OAuth2 PKCE flow" --agent claude-code')
  .example('memex fetch "rust async" --yes                        # auto-fetch top results')
  .action(async (target: string, options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await fetchCommand(target, {
      scene: options.scene as any,
      depth: Number(options.depth),
      maxPages: Number(options.maxPages),
      top: Number(options.top),
      yes: options.yes as boolean | undefined,
      sitemap: options.sitemap as boolean | undefined,
      include: options.include as string | undefined,
      exclude: options.exclude as string | undefined,
      agent: options.agent as string | undefined,
      out: options.out as string | undefined,
      aggressive: options.aggressive as boolean | undefined,
      dryRun: options.dryRun as boolean | undefined,
      vault,
    }, process.cwd());
  });

cli.command('distill [input]', 'Distill a session (JSONL/text) into a raw wiki document')
  .option('--out <out>', 'Output path')
  .option('--role <role>', 'Role to extract best practices for (e.g., backend-engineer)')
  .option('--agent <agent>', 'AI agent: claude-code | codex | opencode | gemini-cli | aider')
  .option('--scene <scene>', 'Wiki scene: personal/research/reading/team (default: team)')
  .option('--latest', 'Auto-discover the most recent session from agent session directory')
  .option('--no-llm', 'Mechanical extraction only (requires concrete file path)')
  .option('--dry-run', 'Print prompt only')
  .option('--vault <vault>', 'Vault path')
  .example('memex distill                                       # convert latest/current session → ~/.llmwiki/raw/team/sessions/*.md')
  .example('memex distill --scene personal                      # file sessions under raw/personal/sessions/')
  .example('memex distill session.jsonl')
  .example('memex distill --latest                              # auto-find latest session')
  .example('memex distill --latest --role backend-engineer      # distill with role')
  .example('memex distill .\\sessions\\today.jsonl --role backend-engineer')
  .example('memex distill --agent codex')
  .action(async (input: string | undefined, options: Record<string, unknown>) => {
    await distillCommand({
      input,
      out: options.out as string | undefined,
      role: options.role as string | undefined,
      agent: options.agent as string | undefined,
      scene: options.scene as DistillOptions['scene'] | undefined,
      latest: options.latest as boolean | undefined,
      noLlm: !options.llm,
      dryRun: options.dryRun as boolean | undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

// ── Knowledge processing ──────────────────────────────────────────────────────

cli.command('ingest [target]', 'Ingest raw content into wiki pages (delegates to AI agent)')
  .option('--agent <agent>', 'AI agent: claude-code | codex | opencode | gemini-cli | aider')
  .option('--dry-run', 'Print prompt only, do not execute')
  .option('--fix-lint', 'Prepend current lint issues to the prompt so the agent fixes them first')
  .option('--loop', 'Run ingest→lint repeatedly until clean (alias for watch --once)')
  .option('--max-iter <n>', 'Max iterations when --loop is set', { default: 3 })
  .option('--vault <vault>', 'Vault path')
  .example('memex ingest                              # ingest all raw/ files')
  .example('memex ingest raw/personal                 # ingest personal scene')
  .example('memex ingest --fix-lint                   # one-shot lint-driven cleanup')
  .example('memex ingest --loop --max-iter 5          # self-heal until clean')
  .example('memex ingest "notes about React"          # natural language')
  .example('memex ingest --agent codex                # use Codex')
  .action(async (target: string | undefined, options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await ensureAgent(options.agent as string | undefined, vault);
    if (options.loop) {
      const { runIngestLintLoop } = await import('./core/ingest-lint-loop.js');
      await runIngestLintLoop({
        vault,
        cwd: process.cwd(),
        target,
        agent: options.agent as string | undefined,
        maxIter: options.maxIter ? Number(options.maxIter) : 3,
      });
      return;
    }
    let lintReport;
    if (options.fixLint) {
      const { runLint } = await import('./commands/lint.js');
      lintReport = await runLint({ vault }, process.cwd());
    }
    await ingestCommand({
      target,
      agent: options.agent as string | undefined,
      dryRun: options.dryRun as boolean | undefined,
      lintReport,
      vault,
    }, process.cwd());
  });

cli.command('watch', 'Watch raw/ and auto ingest → lint → ingest until clean')
  .option('--path <path>', 'Path to watch (default: <vault>/raw)')
  .option('--daemon', 'Spawn a detached background daemon')
  .option('--deamon', 'Same as --daemon (common misspelling)')
  .option('--stop', 'Stop the running watch daemon')
  .option('--status', 'Show live daemon phase + current files + recent log tail')
  .option('-f, --follow', 'Live-tail the daemon log (like `tail -f`)')
  .option('--once', 'Run a single ingest→lint pass now and exit')
  .option('--agent <agent>', 'AI agent to use for auto-ingest')
  .option(
    '--max-iter <n>',
    'Max ingest↔lint iterations per batch (0 = unlimited, default)',
    { default: 0 },
  )
  .option(
    '--force',
    'Disable the "no progress twice in a row" convergence guard — loop until clean or user-stop',
  )
  .option(
    '--heal',
    'Auto-heal: run lint periodically and enter ingest→lint loop whenever issues are found, even without file events',
  )
  .option('--heal-interval <ms>', 'Heal-check period when --heal is on', { default: 60000 })
  .option('--no-heal-on-start', 'Skip the startup heal check (only periodic)')
  .option('--debounce <ms>', 'Debounce window after file changes', { default: 3000 })
  .option('--ext <list>', 'Comma-separated extensions to react to', { default: 'md,mdx,txt,rst,ts,tsx,js,jsx,vue,svelte,css,scss,less,html,py,go,rs,java,kt,cs,rb,php,swift,json,jsonl,yaml,yml,toml,xml,env,ini,cfg,sh,bash,ps1,bat,cmd,zsh,sql,graphql,proto,dockerfile,gitignore' })
  .option('--vault <vault>', 'Vault path')
  .example('memex watch                         # foreground, file-event driven')
  .example('memex watch --daemon                # background daemon, file-event driven')
  .example('memex watch --daemon --heal         # + periodic lint → auto-fix when dirty')
  .example('memex watch --daemon --heal --heal-interval 30000')
  .example('memex watch --daemon --heal --force # heal + never bail on no-change')
  .example('memex watch --max-iter 3            # cap each batch to 3 iterations')
  .example('memex watch --stop                  # stop daemon')
  .example('memex watch --status                # live phase / current files / stats')
  .example('memex watch --follow                # tail -f the daemon log')
  .example('memex watch --once                  # single ingest→lint pass')
  .action(async (options: Record<string, unknown>) => {
    const wantsControl = Boolean(options.stop) || Boolean(options.status) || Boolean(options.follow);
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    if (!wantsControl) {
      await ensureAgent(options.agent as string | undefined, vault);
    }
    if (options.deamon && !options.daemon) {
      logger.info('已把 --deamon 当作 --daemon（正确拼写为 d-e-a-m-o-n）。');
    }
    const daemon =
      Boolean(options.daemon) || Boolean(options.deamon) ? true : undefined;
    await watchCommand({
      path: options.path as string | undefined,
      daemon,
      stop: options.stop as boolean | undefined,
      status: options.status as boolean | undefined,
      follow: options.follow as boolean | undefined,
      once: options.once as boolean | undefined,
      agent: options.agent as string | undefined,
      maxIter: options.maxIter !== undefined ? Number(options.maxIter) : undefined,
      force: options.force as boolean | undefined,
      heal: options.heal as boolean | undefined,
      healInterval: options.healInterval !== undefined ? Number(options.healInterval) : undefined,
      healOnStart: options.healOnStart as boolean | undefined,
      debounce: options.debounce ? Number(options.debounce) : undefined,
      ext: options.ext as string | undefined,
      vault,
    }, process.cwd());
  });

// ── Wiki operations ───────────────────────────────────────────────────────────

cli.command('new <type> <name>', 'Scaffold a new wiki page')
  .option('--scene <scene>', 'Scene', { default: 'research' })
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--vault <vault>', 'Vault path')
  .action(async (type: string, name: string, options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await newCommand({
      type: type as any,
      name,
      scene: options.scene as any,
      tags: (options.tags as string)?.split(','),
      vault,
    }, process.cwd());
  });

cli.command('log <action>', 'Append an entry to log.md')
  .option('--target <target>', 'Target page')
  .option('--note <note>', 'Note text')
  .option('--vault <vault>', 'Vault path')
  .action(async (action: string, options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await logCommand({
      action,
      target: options.target as string | undefined,
      note: options.note as string | undefined,
      vault,
    }, process.cwd());
  });

cli.command('search <query>', 'Search wiki and raw pages')
  .option('--scene <scene>', 'Filter by scene')
  .option('--type <type>', 'Filter by type')
  .option('--engine <engine>', 'ripgrep, qmd, or hybrid')
  .option('--json', 'Output JSON')
  .option('--limit <limit>', 'Result limit', { default: 10 })
  .option('--no-include-raw', 'Only search wiki/ (skip raw/)')
  .option('--vault <vault>', 'Vault path')
  .action(async (query: string, options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await searchCommand({
      query,
      scene: options.scene as string | undefined,
      type: options.type as string | undefined,
      engine: options.engine as 'ripgrep' | 'qmd' | 'hybrid' | undefined,
      json: options.json as boolean | undefined,
      limit: Number(options.limit),
      includeRaw: options.includeRaw as boolean | undefined,
      vault,
    }, process.cwd());
  });

cli.command('lint', 'Health-check the wiki')
  .option('--scene <scene>', 'Filter by scene')
  .option('--check <check>', 'Comma-separated checks')
  .option('--json', 'Output JSON')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await lintCommand({
      scene: options.scene as string | undefined,
      check: options.check as string | undefined,
      json: options.json as boolean | undefined,
      vault,
    }, process.cwd());
  });

cli.command('link-check', 'Validate wiki links')
  .option('--fix', 'Suggest fixes')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await linkCheckCommand({
      fix: options.fix as boolean | undefined,
      vault,
    }, process.cwd());
  });

// ── Context injection ─────────────────────────────────────────────────────────

cli.command('glob', 'Project relevant wiki pages into local vault')
  .option('--project <project>', 'Project directory', { default: '.' })
  .option('--into <into>', 'Local vault destination')
  .option('--keywords <keywords>', 'Comma-separated keywords')
  .option('--max <max>', 'Max pages', { default: 30 })
  .option('--vault <vault>', 'Global vault path')
  .action(async (options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await globCommand({
      project: options.project as string,
      into: options.into as string | undefined,
      keywords: options.keywords as string | undefined,
      max: Number(options.max),
      vault,
    }, process.cwd());
  });

cli.command('inject', 'Output wiki context for agent consumption')
  .option('--task <task>', 'Task description')
  .option('--keywords <keywords>', 'Comma-separated keywords')
  .option('--format <format>', 'md or json', { default: 'md' })
  .option('--max-tokens <max>', 'Token limit')
  .option('--vault <vault>', 'Vault path')
  .action(async (options: Record<string, unknown>) => {
    const vault = await ensureVault(options.vault as string | undefined, process.cwd());
    await injectCommand({
      task: options.task as string | undefined,
      keywords: options.keywords as string | undefined,
      format: options.format as 'md' | 'json',
      maxTokens: options.maxTokens ? Number(options.maxTokens) : undefined,
      vault,
    }, process.cwd());
  });

// ── Agent integration ─────────────────────────────────────────────────────────

cli.command('install-hooks', 'Install memex as slash commands in your AI agent session')
  .option('--agent <agent>', 'Agent: claude-code | codex | opencode | gemini-cli | cursor | generic', { default: 'claude-code' })
  .option('--scope <scope>', 'Install scope: project | user', { default: 'project' })
  .option('--project <dir>', 'Project directory (default: current directory)')
  .option('--dry-run', 'Preview files without writing')
  .option('--no-context', 'Skip writing the L0 context bootstrap block')
  .option('--context-mode <mode>', 'Context block mode: minimal | digest', { default: 'digest' })
  .example('memex install-hooks                        # install slash cmds + L0 context')
  .example('memex install-hooks --scope user           # install into user-level agent config')
  .example('memex install-hooks --agent codex          # install for Codex')
  .example('memex install-hooks --no-context           # skip L0 bootstrap block')
  .example('memex install-hooks --dry-run              # preview only')
  .action(async (options: Record<string, unknown>) => {
    const agent = options.agent as string;
    const scope = options.scope as 'project' | 'user' | undefined;
    const projectDir = options.project as string | undefined;
    const dryRun = options.dryRun as boolean | undefined;
    await installHooksCommand({
      agent,
      scope,
      dryRun,
      projectDir,
    }, process.cwd());
    // L0 context bootstrap is project-root state; skip it for user-level hook installs.
    if (options.context !== false && scope !== 'user') {
      try {
        await contextCommand({
          subcommand: 'install',
          agent,
          project: projectDir,
          mode: (options.contextMode as 'minimal' | 'digest') ?? 'digest',
          dryRun,
        }, process.cwd());
      } catch (err) {
        // non-fatal: hooks installed is still useful
        console.error(`\n[context] L0 bootstrap skipped: ${(err as Error).message}`);
      }
    }
  });

// ── L0 context bootstrap ──────────────────────────────────────────────────────

cli.command('context [subcommand]', 'Manage L0 project-root context bootstrap block  (install | refresh | uninstall | status)')
  .option('--agent <agent>', 'Agent id (comma-separated for multiple)')
  .option('--project <dir>', 'Project directory (default: current directory)')
  .option('--mode <mode>', 'Content mode: minimal | digest', { default: 'digest' })
  .option('--vault <vault>', 'Vault path (default: auto-resolve)')
  .option('--scene <scenes>', 'Wiki scenes to bind (comma-separated, e.g. component-library,architecture)')
  .option('--all', 'refresh: iterate over every registered project')
  .option('--quiet', 'suppress non-error output')
  .option('--dry-run', 'Preview only')
  .example('memex context install                                    # write block for current project+agent')
  .example('memex context install --scene component-library          # bind a wiki scene')
  .example('memex context install --agent claude-code,codex')
  .example('memex context refresh                                    # re-render block with latest wiki digest')
  .example('memex context refresh --all                              # refresh every registered project')
  .example('memex context uninstall                                  # strip block from host file(s)')
  .example('memex context status                                     # list all registered projects')
  .action(async (subcommand: string | undefined, options: Record<string, unknown>) => {
    const sub = (subcommand ?? 'status') as 'install' | 'refresh' | 'uninstall' | 'status';
    if (!['install', 'refresh', 'uninstall', 'status'].includes(sub)) {
      console.error(`Unknown subcommand: ${sub}`);
      console.error('Usage: memex context <install|refresh|uninstall|status>');
      process.exit(2);
    }
    await contextCommand({
      subcommand: sub,
      agent: options.agent as string | undefined,
      project: options.project as string | undefined,
      mode: options.mode as 'minimal' | 'digest' | undefined,
      vault: options.vault as string | undefined,
      scene: options.scene as string | undefined,
      all: options.all as boolean | undefined,
      quiet: options.quiet as boolean | undefined,
      dryRun: options.dryRun as boolean | undefined,
    }, process.cwd());
  });

// ── Migrations ────────────────────────────────────────────────────────────────

cli.command('migrate', 'Migrate the vault to a newer schema')
  .option('--from-summary-subtype', 'Convert legacy `type: summary` + `subtype` pages to the 6-type schema (v0.5.0+)')
  .option('--dry-run', 'Print what would change without touching files')
  .option('--vault <vault>', 'Vault path')
  .example('memex migrate --from-summary-subtype --dry-run')
  .example('memex migrate --from-summary-subtype')
  .action(async (options: Record<string, unknown>) => {
    await migrateCommand({
      fromSummarySubtype: options.fromSummarySubtype as boolean | undefined,
      dryRun: options.dryRun as boolean | undefined,
      vault: options.vault as string | undefined,
    }, process.cwd());
  });

// ── Self-update ──────────────────────────────────────────────────────────────

cli.command('update', 'Update memex to the latest version')
  .option('--check', 'Only check for updates, do not install')
  .option('--source <source>', 'Force update source: npm | github')
  .example('memex update                    # auto-detect and update')
  .example('memex update --check            # check for updates only')
  .example('memex update --source github    # force update from GitHub')
  .action(async (options: Record<string, unknown>) => {
    await updateCommand({
      check: options.check as boolean | undefined,
      source: options.source as 'npm' | 'github' | undefined,
    });
  });

cli.help();
cli.version(getPackageVersion());

parseCliWithFriendlyErrors(cli);
