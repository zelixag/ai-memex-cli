import { readFileUtf8, writeFileUtf8, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface InstallHooksOptions {
  agent: string;
  events?: string;
  dryRun?: boolean;
}

export async function installHooksCommand(options: InstallHooksOptions, cwd: string): Promise<void> {
  if (options.agent !== 'claude-code') {
    logger.error(`Unsupported agent: ${options.agent}. Currently only "claude-code" is supported.`);
    logger.info('Roadmap: Cursor, Windsurf, Codex support in Phase 2.');
    return;
  }

  const settingsPath = join(homedir(), '.claude', 'settings.json');

  let settings: Record<string, unknown> = {};
  if (await pathExists(settingsPath)) {
    try {
      settings = JSON.parse(await readFileUtf8(settingsPath));
    } catch {
      logger.warn('Could not parse existing settings.json. Will create new one.');
    }
  }

  const hooks = (settings.hooks as Record<string, string> | undefined) || {};
  const events = options.events ? options.events.split(',') : ['sessionstart', 'sessionend'];

  if (events.includes('sessionstart')) {
    hooks['SessionStart'] = 'memex glob --project .';
  }
  if (events.includes('sessionend')) {
    hooks['SessionEnd'] = 'memex distill ~/.claude/sessions/last-session.jsonl';
  }

  const next = { ...settings, hooks };

  if (options.dryRun) {
    logger.info('Dry run — would write:');
    console.log(JSON.stringify(next, null, 2));
    return;
  }

  await writeFileUtf8(settingsPath, JSON.stringify(next, null, 2) + '\n');
  logger.success(`Installed hooks to ${settingsPath}`);
  logger.info('Hooks configured:');
  for (const [event, cmd] of Object.entries(hooks)) {
    logger.info(`  ${event}: ${cmd}`);
  }
}
