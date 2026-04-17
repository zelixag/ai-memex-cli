/**
 * onboard.ts
 *
 * `memex onboard`
 *
 * Interactive onboarding wizard that guides the user through:
 *
 *   Step 1 — Choose your AI agent (with auto-detect)
 *   Step 2 — Confirm / set session directory
 *   Step 3 — Initialize global vault (if not exists)
 *   Step 4 — Install slash commands for the chosen agent
 *   Step 5 — Summary & next steps
 *
 * After onboard, all memex commands (ingest, distill, fetch, etc.)
 * automatically use the configured agent and session paths.
 */

import { select, confirm, input } from '@inquirer/prompts';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../utils/logger.js';
import { pathExists, normalizePath } from '../utils/fs.js';
import { AGENT_PROFILES, AgentId, detectInstalledAgents } from '../core/agent-adapter.js';
import { writeGlobalConfig, readGlobalConfig } from '../core/config.js';
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

  // ── Step 1: Choose Agent ──────────────────────────────────────────────────

  logger.info('Step 1/5 — Choose your AI agent\n');

  // Auto-detect installed agents
  const installed = await detectInstalledAgents();
  if (installed.length > 0) {
    logger.info(`Detected installed agents: ${installed.map(a => a.id).join(', ')}`);
  }

  let agentId: AgentId;

  if (options.agent) {
    agentId = options.agent as AgentId;
    if (!AGENT_PROFILES[agentId]) {
      logger.error(`Unknown agent: ${options.agent}`);
      return;
    }
    logger.info(`Using pre-selected agent: ${agentId}`);
  } else if (options.yes && installed.length > 0) {
    agentId = installed[0].id;
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
          description: `${profile.description} → ${profile.contextFile}`,
        };
      }
    );

    agentId = await select({
      message: 'Which AI agent do you primarily use?',
      choices,
      default: installed.length > 0 ? installed[0].id : 'claude-code',
    });
  }

  const profile = AGENT_PROFILES[agentId];
  console.log();
  logger.success(`Selected: ${profile.name} (context file: ${profile.contextFile})`);

  // ── Step 2: Session Directory ─────────────────────────────────────────────

  console.log();
  logger.info('Step 2/5 — Session directory\n');

  let sessionDir = profile.sessionDir
    ? join(home, profile.sessionDir).replace(/\\/g, '/')
    : '';

  if (sessionDir) {
    const sessionExists = await pathExists(sessionDir);
    if (sessionExists) {
      logger.success(`Found session directory: ${sessionDir}`);
    } else {
      logger.warn(`Expected session directory not found: ${sessionDir}`);
    }

    if (!options.yes) {
      const useDefault = await confirm({
        message: `Use ${profile.sessionHint ?? sessionDir} as session directory?`,
        default: true,
      });

      if (!useDefault) {
        const customDir = await input({
          message: 'Enter your session directory path:',
          default: sessionDir,
        });
        sessionDir = normalizePath(customDir);
      }
    }
  } else {
    logger.info(`${profile.name} does not have a known session directory.`);
    if (!options.yes) {
      const customDir = await input({
        message: 'Enter session directory path (or press Enter to skip):',
        default: '',
      });
      if (customDir) {
        sessionDir = normalizePath(customDir);
      }
    }
  }

  if (sessionDir) {
    logger.success(`Session directory: ${sessionDir}`);
  }

  // ── Step 3: Initialize Vault ──────────────────────────────────────────────

  console.log();
  logger.info('Step 3/5 — Initialize knowledge base vault\n');

  const globalVaultPath = join(home, '.llmwiki', 'global').replace(/\\/g, '/');
  const vaultExists = await pathExists(join(globalVaultPath, 'AGENTS.md'));

  if (vaultExists) {
    logger.success(`Global vault already exists: ${globalVaultPath}`);
  } else {
    let doInit = true;
    if (!options.yes) {
      doInit = await confirm({
        message: `Initialize global vault at ${globalVaultPath}?`,
        default: true,
      });
    }

    if (doInit) {
      await initCommand({ scope: 'global' }, cwd);
      logger.success('Global vault initialized.');
    } else {
      logger.info('Skipped vault initialization.');
    }
  }

  // ── Step 4: Install Slash Commands ────────────────────────────────────────

  console.log();
  logger.info('Step 4/5 — Install slash commands\n');

  let doInstallHooks = true;
  let hooksProjectDir = cwd;

  if (!options.yes) {
    doInstallHooks = await confirm({
      message: `Install /memex:* slash commands for ${profile.name}?`,
      default: true,
    });

    if (doInstallHooks) {
      const useCurrentDir = await confirm({
        message: `Install in current directory? (${cwd})`,
        default: true,
      });

      if (!useCurrentDir) {
        const customProjectDir = await input({
          message: 'Enter project directory:',
          default: cwd,
        });
        hooksProjectDir = normalizePath(customProjectDir);
      }
    }
  }

  if (doInstallHooks) {
    await installHooksCommand({
      agent: agentId,
      projectDir: hooksProjectDir,
    }, cwd);
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
          agent: agentId,
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
  const configPatch: Record<string, unknown> = { agent: agentId };
  if (sessionDir) {
    configPatch.sessionDir = sessionDir;
  }
  await writeGlobalConfig(configPatch as any);
  logger.success(`Saved to ~/.llmwiki/config.json`);

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log();
  console.log('  ┌───────────────────────────────────────────────────┐');
  console.log('  │  Onboarding complete!                             │');
  console.log('  └───────────────────────────────────────────────────┘');
  console.log();
  console.log(`  Agent:           ${profile.name} (${agentId})`);
  console.log(`  Context file:    ${profile.contextFile}`);
  console.log(`  Session dir:     ${sessionDir || '(not set)'}`);
  console.log(`  Vault:           ${globalVaultPath}`);
  console.log(`  Hooks:           ${doInstallHooks ? hooksProjectDir : '(skipped)'}`);
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
    console.log('     > /memex:search "your topic"');
    console.log('     > /memex:inject --task "your current task"');
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
  if (sessionDir) {
    console.log(`     $ memex distill --latest`);
    console.log(`     $ memex distill "${sessionDir}/<session-file>"`);
  } else {
    console.log('     $ memex distill <session-file>');
  }
  console.log();
  logger.info('Run `memex --help` to see all available commands.');
  console.log();
}
