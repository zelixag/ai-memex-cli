/**
 * install-hooks.ts
 *
 * `memex install-hooks [--agent <agent>] [--project <dir>] [--dry-run]`
 *
 * Installs memex as slash commands inside AI agent sessions.
 * After running this, you can type in your agent session:
 *
 *   /memex:ingest raw/personal
 *   /memex:fetch https://react.dev/reference
 *   /memex:distill --role backend-engineer
 *   /memex:search "react hooks"
 *   /memex:status
 *
 * Generated file locations per agent:
 *
 *   claude-code  →  .claude/commands/memex-*.md     slash: /memex:*
 *   codex        →  AGENTS.md  (appends ## Memex Commands section)
 *   opencode     →  .opencode/commands/memex-*.md   slash: /memex:*
 *   gemini-cli   →  .gemini/commands/memex-*.md     slash: /memex:*
 *   cursor       →  .cursor/rules/memex.mdc
 *   generic      →  AGENTS.md  (same as codex)
 */

import { writeFileUtf8, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { join } from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';

export interface InstallHooksOptions {
  agent?: string;
  events?: string;
  dryRun?: boolean;
  /** Project directory to install hooks into (default: cwd) */
  projectDir?: string;
}

// ── Command definitions ───────────────────────────────────────────────────────

interface MemexCommand {
  name: string;
  description: string;
  usage: string;
  shellCmd: string;
  examples: string[];
}

const MEMEX_COMMANDS: MemexCommand[] = [
  {
    name: 'ingest',
    description: 'Ingest raw content into wiki pages. Delegates semantic processing to the AI agent.',
    usage: '/memex:ingest [target]',
    shellCmd: 'memex ingest $ARGS',
    examples: [
      '/memex:ingest                        # ingest all raw/ files',
      '/memex:ingest raw/personal           # ingest personal scene only',
      '/memex:ingest "notes about React"    # natural language target',
    ],
  },
  {
    name: 'fetch',
    description: 'Fetch web content or documentation into the raw/ directory.',
    usage: '/memex:fetch <url> [options]',
    shellCmd: 'memex fetch $ARGS',
    examples: [
      '/memex:fetch https://react.dev/reference/react/hooks',
      '/memex:fetch https://docs.anthropic.com --depth 2',
      '/memex:fetch https://nextjs.org/sitemap.xml --sitemap',
    ],
  },
  {
    name: 'distill',
    description: 'Distill the current or a past session into a structured raw wiki document.',
    usage: '/memex:distill [input] [--role <role>]',
    shellCmd: 'memex distill $ARGS',
    examples: [
      '/memex:distill                              # distill current session',
      '/memex:distill --role backend-engineer      # extract role-specific best practices',
      '/memex:distill session.jsonl                # distill a saved session file',
    ],
  },
  {
    name: 'search',
    description: 'Search the wiki and raw knowledge base.',
    usage: '/memex:search <query>',
    shellCmd: 'memex search $ARGS',
    examples: [
      '/memex:search "React hooks"',
      '/memex:search "deployment best practices" --scene team',
    ],
  },
  {
    name: 'status',
    description: 'Show vault overview: page count, scenes, recent activity.',
    usage: '/memex:status',
    shellCmd: 'memex status',
    examples: ['/memex:status'],
  },
  {
    name: 'new',
    description: 'Scaffold a new wiki page with correct frontmatter.',
    usage: '/memex:new <type> <name> [--scene <scene>]',
    shellCmd: 'memex new $ARGS',
    examples: [
      '/memex:new concept "React Server Components" --scene research',
      '/memex:new entity "TypeScript" --scene personal',
    ],
  },
  {
    name: 'lint',
    description: 'Health-check the wiki: orphan pages, missing frontmatter, broken links.',
    usage: '/memex:lint',
    shellCmd: 'memex lint',
    examples: ['/memex:lint', '/memex:lint --json'],
  },
  {
    name: 'inject',
    description: 'Output relevant wiki context for the current task (saves tokens, improves precision).',
    usage: '/memex:inject [--task <description>] [--keywords <kw>]',
    shellCmd: 'memex inject $ARGS',
    examples: [
      '/memex:inject --task "implement authentication"',
      '/memex:inject --keywords "react,typescript,hooks"',
    ],
  },
  {
    name: 'log',
    description: 'Append a log entry to the vault activity log.',
    usage: '/memex:log <action> [--note <text>]',
    shellCmd: 'memex log $ARGS',
    examples: [
      '/memex:log ingest --target "react-hooks" --note "added from docs"',
      '/memex:log decision --note "chose Zustand over Redux for simplicity"',
    ],
  },
];

// ── Claude Code command file generator ───────────────────────────────────────

interface HookFile {
  path: string;
  content: string;
  description: string;
}

function buildClaudeCodeCommandFile(cmd: MemexCommand): string {
  return `# memex ${cmd.name}

${cmd.description}

## Usage

\`${cmd.usage}\`

## Examples

${cmd.examples.map(e => `- \`${e}\``).join('\n')}

## Instructions

Run the following shell command, substituting \`$ARGS\` with any arguments
the user provided after \`/memex:${cmd.name}\`:

\`\`\`bash
${cmd.shellCmd}
\`\`\`

Report the command output to the user. If the command modifies wiki pages,
briefly summarize what changed.
`;
}

function buildClaudeCodeHelpFile(): string {
  return `# memex help

Show all available memex knowledge base commands.

## Action

\`\`\`bash
memex --help
\`\`\`

## Available slash commands

${MEMEX_COMMANDS.map(cmd => `- \`/memex:${cmd.name}\` — ${cmd.description}`).join('\n')}

## Quick start

\`\`\`
/memex:status                                # see what's in the knowledge base
/memex:search "topic"                        # find relevant pages
/memex:inject --task "current task"          # load context for this session
/memex:fetch https://docs.example.com        # fetch documentation
/memex:ingest                                # process raw files into wiki pages
/memex:distill --role backend-engineer       # distill session into best practices
\`\`\`
`;
}

function generateClaudeCodeHooks(projectDir: string): HookFile[] {
  const commandsDir = join(projectDir, '.claude', 'commands').replace(/\\/g, '/');
  const files: HookFile[] = [];

  for (const cmd of MEMEX_COMMANDS) {
    files.push({
      path: join(commandsDir, `memex-${cmd.name}.md`).replace(/\\/g, '/'),
      content: buildClaudeCodeCommandFile(cmd),
      description: `/memex:${cmd.name}`,
    });
  }

  files.push({
    path: join(commandsDir, 'memex-help.md').replace(/\\/g, '/'),
    content: buildClaudeCodeHelpFile(),
    description: '/memex:help',
  });

  return files;
}

// ── OpenCode command file generator ──────────────────────────────────────────

function generateOpenCodeHooks(projectDir: string): HookFile[] {
  const commandsDir = join(projectDir, '.opencode', 'commands').replace(/\\/g, '/');
  return MEMEX_COMMANDS.map(cmd => ({
    path: join(commandsDir, `memex-${cmd.name}.md`).replace(/\\/g, '/'),
    content: `---
name: memex-${cmd.name}
description: "${cmd.description}"
---

# memex ${cmd.name}

${cmd.description}

**Usage:** \`${cmd.usage}\`

**Shell command:**
\`\`\`bash
${cmd.shellCmd}
\`\`\`

**Examples:**
${cmd.examples.map(e => `- \`${e}\``).join('\n')}
`,
    description: `/memex:${cmd.name}`,
  }));
}

// ── Gemini CLI command file generator ────────────────────────────────────────

function generateGeminiCliHooks(projectDir: string): HookFile[] {
  const commandsDir = join(projectDir, '.gemini', 'commands').replace(/\\/g, '/');
  return MEMEX_COMMANDS.map(cmd => ({
    path: join(commandsDir, `memex-${cmd.name}.md`).replace(/\\/g, '/'),
    content: `# /memex:${cmd.name}

${cmd.description}

Usage: \`${cmd.usage}\`

When this command is invoked, execute:
\`\`\`bash
${cmd.shellCmd}
\`\`\`

Examples:
${cmd.examples.map(e => `  ${e}`).join('\n')}
`,
    description: `/memex:${cmd.name}`,
  }));
}

// ── Cursor rules generator ────────────────────────────────────────────────────

function generateCursorHooks(projectDir: string): HookFile[] {
  const content = `---
description: memex knowledge base commands — use these to manage the LLM wiki
globs: ["**/*"]
alwaysApply: false
---

# memex Knowledge Base Commands

You have access to the \`memex\` CLI for managing a persistent knowledge base.
Use these commands proactively to store and retrieve knowledge across sessions.

## Available Commands

${MEMEX_COMMANDS.map(cmd => `### ${cmd.name}

${cmd.description}

**Shell:** \`${cmd.shellCmd}\`

**Examples:**
${cmd.examples.map(e => `- \`${e}\``).join('\n')}
`).join('\n')}

## When to Use memex Proactively

- **Start of session**: Run \`memex inject --task "<current task>"\` to load relevant context
- **When you learn something new**: Run \`memex log ingest --note "<insight>"\`
- **End of session**: Run \`memex distill\` to save session knowledge
- **Before answering domain questions**: Run \`memex search "<topic>"\` first
`;

  return [{
    path: join(projectDir, '.cursor', 'rules', 'memex.mdc').replace(/\\/g, '/'),
    content,
    description: 'Cursor rules for memex commands',
  }];
}

// ── AGENTS.md section generator (codex / generic) ────────────────────────────

function buildAgentsMdSection(): string {
  return `
## Memex Knowledge Base Commands

You have access to the \`memex\` CLI for managing a persistent knowledge base (LLM Wiki).
Use these commands to store and retrieve knowledge across sessions.

### Available Commands

${MEMEX_COMMANDS.map(cmd => `#### \`${cmd.shellCmd.replace('$ARGS', '[args]')}\`

${cmd.description}

Examples:
${cmd.examples.map(e => `  $ ${e.replace(/^\/memex:\w+\s*/, `memex ${cmd.name} `).replace(/^\/memex:\w+$/, `memex ${cmd.name}`)}`).join('\n')}
`).join('\n')}

### When to Use memex Proactively

- **Before starting a task**: Run \`memex inject --task "<description>"\` to load relevant wiki context
- **When you discover new knowledge**: Run \`memex log ingest --note "<insight>"\` to record it
- **After completing a session**: Run \`memex distill\` to extract best practices
- **When answering domain questions**: Run \`memex search "<topic>"\` to check the wiki first
`;
}

// ── Main command ──────────────────────────────────────────────────────────────

export async function installHooksCommand(
  options: InstallHooksOptions,
  cwd: string
): Promise<void> {
  const projectDir = options.projectDir ?? cwd;
  const agentType = (options.agent ?? 'claude-code') as string;

  logger.info(`Installing memex slash commands for: ${agentType}`);
  logger.info(`Project directory: ${projectDir}`);

  // ── codex / generic: append to AGENTS.md ─────────────────────────────────
  if (agentType === 'codex' || agentType === 'generic') {
    const agentsMdPath = join(projectDir, 'AGENTS.md').replace(/\\/g, '/');
    const section = buildAgentsMdSection();

    if (options.dryRun) {
      logger.info(`Would append to: ${agentsMdPath}`);
      console.log('\n--- AGENTS.md section ---\n');
      console.log(section);
      console.log('--- END ---\n');
      return;
    }

    let existing = '';
    if (await pathExists(agentsMdPath)) {
      existing = await readFile(agentsMdPath, 'utf-8');
      if (existing.includes('## Memex Knowledge Base Commands')) {
        logger.warn('AGENTS.md already has a memex section. Skipping.');
        return;
      }
    } else {
      existing = '# Agent Instructions\n';
    }

    await writeFileUtf8(agentsMdPath, existing + '\n' + section);
    logger.success(`Updated ${agentsMdPath}`);
    printUsageHint(agentType);
    return;
  }

  // ── File-based agents ─────────────────────────────────────────────────────
  let files: HookFile[] = [];

  switch (agentType) {
    case 'claude-code':
      files = generateClaudeCodeHooks(projectDir);
      break;
    case 'opencode':
      files = generateOpenCodeHooks(projectDir);
      break;
    case 'gemini-cli':
      files = generateGeminiCliHooks(projectDir);
      break;
    case 'cursor':
      files = generateCursorHooks(projectDir);
      break;
    default:
      logger.error(`Unknown agent: ${agentType}`);
      logger.info('Supported: claude-code, codex, opencode, gemini-cli, cursor, generic');
      return;
  }

  if (options.dryRun) {
    logger.info(`Would create ${files.length} file(s):\n`);
    for (const f of files) {
      console.log(`  ${f.path}  →  ${f.description}`);
    }
    console.log('\n--- Preview: first file ---\n');
    if (files[0]) console.log(files[0].content);
    return;
  }

  // Write all files
  let created = 0;
  for (const f of files) {
    const dir = f.path.substring(0, f.path.lastIndexOf('/'));
    await mkdir(dir, { recursive: true });
    await writeFileUtf8(f.path, f.content);
    logger.success(`Created: ${f.path}`);
    created++;
  }

  logger.info(`\nInstalled ${created} command file(s) for ${agentType}.`);
  printUsageHint(agentType);
}

// ── Usage hints ───────────────────────────────────────────────────────────────

function printUsageHint(agentType: string): void {
  console.log();
  switch (agentType) {
    case 'claude-code':
      logger.info('In your Claude Code session, type:');
      console.log('  /memex:help            — show all commands');
      console.log('  /memex:status          — vault overview');
      console.log('  /memex:search "topic"  — search the wiki');
      console.log('  /memex:inject          — load context for current task');
      console.log('  /memex:fetch <url>     — fetch web docs');
      console.log('  /memex:ingest          — process raw files into wiki');
      console.log('  /memex:distill         — distill this session');
      break;
    case 'opencode':
      logger.info('In your OpenCode session, type:');
      console.log('  /memex:status');
      console.log('  /memex:ingest [target]');
      console.log('  /memex:search "topic"');
      break;
    case 'gemini-cli':
      logger.info('In your Gemini CLI session, type:');
      console.log('  /memex:status');
      console.log('  /memex:ingest [target]');
      break;
    case 'cursor':
      logger.info('In Cursor, the memex rules are now active.');
      logger.info('Ask the agent: "run memex inject for my current task"');
      break;
    case 'codex':
    case 'generic':
      logger.info('The agent will now use memex commands when appropriate.');
      logger.info('You can also ask explicitly: "run memex search <topic>"');
      break;
  }
  console.log();
  logger.info('Install for another agent:  memex install-hooks --agent <agent>');
  logger.info('See all agents:             memex config agents');
}
