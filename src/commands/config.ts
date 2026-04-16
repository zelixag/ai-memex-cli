/**
 * config.ts
 *
 * `memex config` — Manage memex configuration.
 *
 * Subcommands:
 *   memex config list              → show current config
 *   memex config get <key>         → get a config value
 *   memex config set <key> <value> → set a config value
 *   memex config agents            → list all supported agents with install status
 *
 * Config keys:
 *   agent                → default agent (claude-code | codex | opencode | gemini-cli | aider | generic)
 *   search.defaultEngine → ripgrep | qmd | hybrid
 *   glob.maxPages        → number
 *   glob.mode            → copy | link
 *
 * Scope:
 *   --global  → write to ~/.llmwiki/config.json  (default)
 *   --local   → write to <vault>/.llmwiki/config.json
 *
 * Examples:
 *   memex config set agent claude-code
 *   memex config set agent codex
 *   memex config set search.defaultEngine ripgrep
 *   memex config get agent
 *   memex config list
 *   memex config agents
 */

import { readConfig, writeConfig, readGlobalConfig, writeGlobalConfig } from '../core/config.js';
import { resolveVaultPath } from '../core/vault.js';
import { logger } from '../utils/logger.js';
import { printAgentTable, detectInstalledAgents, AGENT_PROFILES, type AgentId } from '../core/agent-adapter.js';

export interface ConfigCommandOptions {
  subcommand: 'list' | 'get' | 'set' | 'agents';
  key?: string;
  value?: string;
  global?: boolean;
  local?: boolean;
  vault?: string;
}

export async function configCommand(options: ConfigCommandOptions, cwd: string): Promise<void> {
  switch (options.subcommand) {
    case 'agents':
      await showAgents();
      break;
    case 'list':
      await listConfig(options, cwd);
      break;
    case 'get':
      await getConfig(options, cwd);
      break;
    case 'set':
      await setConfig(options, cwd);
      break;
    default:
      if (!options.subcommand || !(options.subcommand as string).trim()) {
        logger.info('Usage: memex config <subcommand>');
        logger.info('  memex config list              Show current config');
        logger.info('  memex config get <key>         Get a config value');
        logger.info('  memex config set <key> <value> Set a config value');
        logger.info('  memex config agents            List supported agents');
      } else {
        logger.error(`Unknown subcommand: "${options.subcommand}"`);
        logger.info('Valid subcommands: list, get, set, agents');
        logger.info('Usage: memex config <subcommand>');
      }
  }
}

// ── agents subcommand ─────────────────────────────────────────────────────────

async function showAgents(): Promise<void> {
  logger.info('Supported AI agents:\n');

  const installed = await detectInstalledAgents();
  const installedIds = new Set(installed.map(a => a.id));

  // Header
  console.log(
    '  ' +
    pad('ID', 14) +
    pad('Context File', 18) +
    pad('Status', 16) +
    'Install'
  );
  console.log('  ' + '─'.repeat(72));

  for (const [id, profile] of Object.entries(AGENT_PROFILES)) {
    const isInstalled = installedIds.has(id as AgentId);
    const status = isInstalled
      ? `\x1b[32m✓ ${installed.find(a => a.id === id)?.bin}\x1b[0m`
      : '\x1b[2mnot found\x1b[0m';
    console.log(
      '  ' +
      pad(`\x1b[36m${id}\x1b[0m`, 14 + 9) + // +9 for ANSI escape codes
      pad(profile.contextFile, 18) +
      pad(status, 16 + (isInstalled ? 14 : 10)) +
      `\x1b[2m${profile.installHint}\x1b[0m`
    );
  }

  console.log();
  logger.info('Set your default agent:  memex config set agent <id>');
  logger.info('Use per-command:         memex ingest --agent codex');
}

// ── list subcommand ───────────────────────────────────────────────────────────

async function listConfig(options: ConfigCommandOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);
  const globalCfg = await readGlobalConfig();

  console.log('\n\x1b[1mCurrent configuration:\x1b[0m\n');

  const rows: [string, string, string][] = [
    ['agent', String(config.agent ?? '(auto-detect)'), 'Default AI agent for all commands'],
    ['search.defaultEngine', config.search.defaultEngine, 'Search backend'],
    ['glob.maxPages', String(config.glob.maxPages), 'Max pages to project'],
    ['glob.mode', config.glob.mode, 'copy or symlink'],
  ];

  for (const [key, value, desc] of rows) {
    const isGlobal = getNestedValue(globalCfg, key) !== undefined;
    const scope = isGlobal ? '\x1b[2m(global)\x1b[0m' : '\x1b[2m(default)\x1b[0m';
    console.log(`  \x1b[36m${pad(key, 26)}\x1b[0m ${pad(value, 20)} ${scope}`);
    console.log(`  \x1b[2m${' '.repeat(26)} ${desc}\x1b[0m`);
    console.log();
  }

  console.log(`  Config files:`);
  console.log(`  \x1b[2m  Global: ~/.llmwiki/config.json\x1b[0m`);
  console.log(`  \x1b[2m  Local:  ${vault}/.llmwiki/config.json\x1b[0m`);
  console.log();
}

// ── get subcommand ────────────────────────────────────────────────────────────

async function getConfig(options: ConfigCommandOptions, cwd: string): Promise<void> {
  if (!options.key) {
    logger.error('Usage: memex config get <key>');
    return;
  }
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);
  const value = getNestedValue(config as unknown as Record<string, unknown>, options.key);
  if (value === undefined) {
    logger.warn(`Key not found: ${options.key}`);
  } else {
    console.log(String(value));
  }
}

// ── set subcommand ────────────────────────────────────────────────────────────

async function setConfig(options: ConfigCommandOptions, cwd: string): Promise<void> {
  if (!options.key || options.value === undefined) {
    logger.error('Usage: memex config set <key> <value>');
    return;
  }

  const { key, value } = options;

  // Validate agent values
  if (key === 'agent') {
    const validAgents = Object.keys(AGENT_PROFILES);
    if (!validAgents.includes(value)) {
      logger.error(`Unknown agent: ${value}`);
      logger.info(`Valid agents: ${validAgents.join(', ')}`);
      await showAgents();
      return;
    }
  }

  // Parse value
  const parsed = parseValue(value);

  // Build nested patch object
  const patch = setNestedValue({}, key, parsed);

  // Determine scope
  const useLocal = options.local && !options.global;

  if (useLocal) {
    const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
    await writeConfig(vault, patch as any);
    logger.success(`Set ${key} = ${value} (local vault config)`);
  } else {
    await writeGlobalConfig(patch as any);
    logger.success(`Set ${key} = ${value} (global config: ~/.llmwiki/config.json)`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(str: string, width: number): string {
  // Strip ANSI codes for length calculation
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  return str + ' '.repeat(Math.max(0, width - stripped.length));
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  const parts = key.split('.');
  if (parts.length === 1) {
    return { ...obj, [key]: value };
  }
  const [head, ...rest] = parts;
  return {
    ...obj,
    [head!]: setNestedValue(
      (typeof obj[head!] === 'object' && obj[head!] !== null ? obj[head!] : {}) as Record<string, unknown>,
      rest.join('.'),
      value
    ),
  };
}

function parseValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  return value;
}
