/**
 * onboard.ts
 *
 * `memex onboard`
 *
 * Interactive onboarding wizard that guides the user through:
 *
 *   Step 1 — Choose your AI agent (with auto-detect)
 *   Step 2 — Confirm / set session directory
 *   Step 3 — Initialize default wiki vault under ~/.llmwiki (if not exists)
 *   Step 4 — Install slash commands for the chosen agent
 *   Step 5 — Summary & next steps
 *
 * After onboard, all memex commands (ingest, distill, fetch, etc.)
 * automatically use the configured agent and session paths.
 */

import { checkbox, select, confirm, input } from '@inquirer/prompts';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../utils/logger.js';
import { pathExists, normalizePath } from '../utils/fs.js';
import { AGENT_PROFILES, AgentId, detectInstalledAgents } from '../core/agent-adapter.js';
import { writeGlobalConfig } from '../core/config.js';
import { defaultHomeWikiVaultPath, isValidVault } from '../core/vault.js';
import { initCommand } from './init.js';
import { installHooksCommand } from './install-hooks.js';
import { contextCommand } from './context.js';

export interface OnboardOptions {
  /** Skip interactive prompts, use defaults */
  yes?: boolean;
  /** Pre-select agent */
  agent?: string;
}

export async function onboardCommand(options: OnboardOptions, cwd: string): Promise<void> {
  const home = homedir();

  console.log();
  console.log('  ╔═══════════════════════════════════════════════════╗');
  console.log('  ║                                                   ║');
  console.log('  ║   🧠  Welcome to  m e m e x  onboarding          ║');
  console.log('  ║                                                   ║');
  console.log('  ║   Persistent knowledge base for AI agents         ║');
  console.log('  ║                                                   ║');
  console.log('  ╚═══════════════════════════════════════════════════╝');
  console.log();

  // ── Step 1: Choose Agents ─────────────────────────────────────────────────

  logger.info('Step 1/5 — Choose your AI agents\n');

  // Auto-detect installed agents
  const installed = await detectInstalledAgents();
  if (installed.length > 0) {
    logger.info(`Detected installed agents: ${installed.map(a => a.id).join(', ')}`);
  }

  let agentId: AgentId;
  let configuredAgentIds: AgentId[] = [];

  if (options.agent) {
    const requestedAgents = options.agent
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const unknown = requestedAgents.filter((id) => !AGENT_PROFILES[id as AgentId]);
    if (unknown.length > 0 || requestedAgents.length === 0) {
      logger.error(`Unknown agent: ${unknown.join(', ') || options.agent}`);
      return;
    }
    configuredAgentIds = Array.from(new Set(requestedAgents)) as AgentId[];
    agentId = configuredAgentIds[0]!;
    logger.info(`Using pre-selected agent: ${agentId}`);
  } else if (options.yes && installed.length > 0) {
    agentId = installed[0].id;
    configuredAgentIds = [agentId];
    logger.info(`Auto-selected: ${agentId}`);
  } else {
    // Build choices with installed status
    const choices = (Object.entries(AGENT_PROFILES) as [AgentId, typeof AGENT_PROFILES[AgentId]][]).map(
      ([id, profile]) => {
        const isInstalled = installed.some(a => a.id === id);
        const badge = isInstalled ? ' ✓ installed' : '';
        return {
          name: `${profile.name} (${id})${badge}`,
          value: id,
          checked: installed.length > 0 ? isInstalled : id === 'claude-code',
          description: `${profile.description} → ${profile.contextFile}`,
        };
      }
    );

    configuredAgentIds = await checkbox({
      message: 'Which AI agents do you use with memex?',
      choices,
      required: true,
    });

    agentId = configuredAgentIds[0]!;
  }

  const profile = AGENT_PROFILES[agentId];
  console.log();
  logger.success(`Fallback agent: ${profile.name} (context file: ${profile.contextFile})`);
  logger.info(`Configured agents: ${configuredAgentIds.join(', ')}`);
  logger.info('Each installed agent command will identify its own runtime agent when invoking memex.');

  // ── Step 2: Session Directory ─────────────────────────────────────────────

  console.log();
  logger.info('Step 2/5 — Session directory\n');

  const sessionDirs: Partial<Record<AgentId, string>> = {};

  for (const configuredAgentId of configuredAgentIds) {
    const configuredProfile = AGENT_PROFILES[configuredAgentId];
    let agentSessionDir = configuredProfile.sessionDir
      ? join(home, configuredProfile.sessionDir).replace(/\\/g, '/')
      : '';

    if (agentSessionDir) {
      const sessionExists = await pathExists(agentSessionDir);
      if (sessionExists) {
        logger.success(`${configuredProfile.name}: ${agentSessionDir}`);
      } else {
        logger.warn(`${configuredProfile.name}: expected session directory not found yet: ${agentSessionDir}`);
      }
      sessionDirs[configuredAgentId] = agentSessionDir;
      continue;
    }

    logger.info(`${configuredProfile.name} does not have a known session directory.`);
    if (!options.yes) {
      const customDir = await input({
        message: `Enter ${configuredProfile.name} session directory path (or press Enter to skip):`,
        default: '',
      });
      if (customDir) {
        agentSessionDir = normalizePath(customDir);
        sessionDirs[configuredAgentId] = agentSessionDir;
        logger.success(`${configuredProfile.name}: ${agentSessionDir}`);
      }
    }
  }

  // ── Step 3: Initialize Vault ──────────────────────────────────────────────

  console.log();
  logger.info('Step 3/5 — Initialize knowledge base vault\n');

  const wikiVaultPath = await defaultHomeWikiVaultPath();
  const vaultExists = await isValidVault(wikiVaultPath);

  if (vaultExists) {
    logger.success(`Wiki vault already exists: ${wikiVaultPath}`);
  } else {
    let doInit = true;
    if (!options.yes) {
      const defaultTarget = join(home, '.llmwiki').replace(/\\/g, '/');
      doInit = await confirm({
        message: `Initialize your default wiki vault at ${defaultTarget}?`,
        default: true,
      });
    }

    if (doInit) {
      await initCommand({ scope: 'global', agent: agentId }, home);
      logger.success(`Wiki vault initialized at ${(await defaultHomeWikiVaultPath()).replace(/\\/g, '/')}.`);
    } else {
      logger.info('Skipped vault initialization.');
    }
  }

  // ── Step 4: Install Slash Commands ────────────────────────────────────────

  console.log();
  logger.info('Step 4/5 — Install slash commands\n');

  logger.info('This installs slash commands plus the ai-memex skill when the agent supports skills.');

  let doInstallHooks = true;
  let hooksProjectDir = cwd;
  let hooksScope: 'project' | 'user' = 'project';
  let hookAgentIds: AgentId[] = [...configuredAgentIds];

  if (!options.yes) {
    const installTarget = await select({
      message: `Where should memex install /memex:* commands and skills for the selected agents?`,
      choices: [
        {
          name: `Current project (${cwd})`,
          value: 'project',
          description: 'Best for team repos or project-pinned memex workflows.',
        },
        {
          name: 'User profile',
          value: 'user',
          description: 'Best for personal use across all projects; installs under your home agent config.',
        },
        {
          name: 'Skip for now',
          value: 'skip',
          description: 'You can run `memex install-hooks` later.',
        },
      ],
      default: 'project',
    });

    doInstallHooks = installTarget !== 'skip';
    hooksScope = installTarget === 'user' ? 'user' : 'project';

    if (doInstallHooks && hooksScope === 'project') {
      const customizeProjectDir = await confirm({
        message: 'Use a different project directory?',
        default: false,
      });

      if (customizeProjectDir) {
        const customProjectDir = await input({
          message: 'Enter project directory:',
          default: cwd,
        });
        hooksProjectDir = normalizePath(customProjectDir);
      }
    }
  }

  if (doInstallHooks) {
    for (const hookAgentId of hookAgentIds) {
      await installHooksCommand({
        agent: hookAgentId,
        scope: hooksScope,
        projectDir: hooksProjectDir,
      }, cwd);
    }
  } else {
    logger.info('Skipped hook installation. Run `memex install-hooks` later.');
  }

  // ── Step 4b: L0 Context Bootstrap ─────────────────────────────────────────

  console.log();
  logger.info('Step 4b/5 — Enable session-start context block (L0)\n');
  logger.info(
    'This writes a marker-delimited block to your project\'s CLAUDE.md / AGENTS.md\n' +
    '(or equivalent) so every new session sees the vault location + a wiki digest.'
  );
  console.log();

  let doContext = true;
  if (!options.yes) {
    doContext = await confirm({
      message: 'Install L0 context bootstrap block into the project root?',
      default: true,
    });
  }

  if (doContext) {
    try {
      await contextCommand(
        {
          subcommand: 'install',
          agent: doInstallHooks ? hookAgentIds.join(',') : agentId,
          project: hooksProjectDir,
          mode: 'digest',
        },
        cwd
      );
    } catch (err) {
      logger.warn(`context install failed: ${(err as Error).message}`);
      logger.info('You can retry later with `memex context install`.');
    }
  } else {
    logger.info('Skipped. Run `memex context install` later if you change your mind.');
  }

  // ── Step 5: Save Config & Summary ─────────────────────────────────────────

  console.log();
  logger.info('Step 5/5 — Saving configuration\n');

  // Save to global config
  const configPatch: Record<string, unknown> = { agent: agentId, agents: configuredAgentIds };
  if (Object.keys(sessionDirs).length > 0) {
    configPatch.sessionDirs = sessionDirs;
    const fallbackSessionDir = sessionDirs[agentId];
    if (fallbackSessionDir) {
      configPatch.sessionDir = fallbackSessionDir;
    }
  }
  await writeGlobalConfig(configPatch as any);
  logger.success(`Saved to ~/.llmwiki/config.json`);

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log();
  console.log('  ┌───────────────────────────────────────────────────┐');
  console.log('  │  Onboarding complete!                             │');
  console.log('  └───────────────────────────────────────────────────┘');
  console.log();
  console.log(`  Fallback agent:  ${profile.name} (${agentId})`);
  console.log(`  Agents:          ${configuredAgentIds.join(', ')}`);
  console.log(`  Context file:    ${profile.contextFile}`);
  console.log(`  Session dirs:    ${Object.keys(sessionDirs).length > 0 ? `${Object.keys(sessionDirs).length} configured` : '(not set)'}`);
  console.log(`  Vault:           ${await defaultHomeWikiVaultPath()}`);
  console.log(`  Hooks:           ${doInstallHooks ? `${hooksScope} (${hooksScope === 'user' ? 'user agent config' : hooksProjectDir})` : '(skipped)'}`);
  console.log();
  logger.info('What to do next:\n');
  console.log('  1. Fetch some knowledge:');
  console.log('     $ memex fetch https://your-docs-site.com --depth 2');
  console.log();
  console.log('  2. Process raw files into wiki:');
  console.log('     $ memex ingest');
  console.log();
  console.log('  3. In your agent session, use slash commands:');

  if (agentId === 'claude-code') {
    console.log('     > /memex:query "your topic"');
    console.log('     > /memex:capture https://example.com');
    console.log('     > /memex:distill');
  } else if (agentId === 'cursor') {
    console.log('     Ask: "run memex search for React hooks"');
    console.log('     Ask: "run memex inject for my current task"');
  } else {
    console.log('     $ memex search "your topic"');
    console.log('     $ memex inject --task "your current task"');
    console.log('     $ memex distill');
  }

  console.log();
  console.log('  4. Distill a past session:');
  const fallbackSessionDir = sessionDirs[agentId];
  if (fallbackSessionDir) {
    console.log(`     $ memex distill --latest`);
    console.log(`     $ memex distill --agent ${agentId}`);
  } else {
    console.log('     $ memex distill <session-file>');
  }
  console.log();
  logger.info('Run `memex --help` to see all available commands.');
  console.log();
}
