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
 *   claude-code  →  .claude/commands/memex/*.md     slash: /memex:*
 *   codex        →  ~/.codex/prompts/memex/*.md + AGENTS.md section
 *   opencode     →  .opencode/commands/memex-*.md   slash: /memex:*
 *   gemini-cli   →  .gemini/commands/memex-*.md     slash: /memex:*
 *   cursor       →  .cursor/rules/memex.mdc
 *   generic      →  AGENTS.md  (same as codex)
 */

import { writeFileUtf8, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export interface InstallHooksOptions {
  agent?: string;
  events?: string;
  dryRun?: boolean;
  /** Install target: project writes under projectDir/cwd, user writes under the user's home directory. */
  scope?: 'project' | 'user';
  /** Project directory to install hooks into (default: cwd) */
  projectDir?: string;
}

export function resolveInstallBaseDir(options: InstallHooksOptions, cwd: string): string {
  return (options.scope ?? 'project') === 'user' ? homedir() : (options.projectDir ?? cwd);
}

// ── Command definitions ───────────────────────────────────────────────────────

interface MemexCommand {
  name: string;
  description: string;
  usage: string;
  shellCmd: string;
  examples: string[];
  workflow?: string;
  reference?: string;
  cliHint?: string;
}

const MEMEX_COMMANDS: MemexCommand[] = [
  {
    name: 'capture',
    description: 'Capture URLs, files, pasted text, or search results into the memex raw layer.',
    usage: '/memex:capture <url|file|text|query>',
    shellCmd: 'memex fetch $ARGS',
    workflow: 'Capture',
    reference: 'references/capture-workflow.md',
    cliHint: 'Use `memex fetch` when the input is a URL, sitemap, or keyword query.',
    examples: [
      '/memex:capture https://react.dev/reference/react/hooks',
      '/memex:capture "agent memory design tradeoffs"',
      '/memex:capture ./notes/architecture.md',
    ],
  },
  {
    name: 'ingest',
    description: 'Ingest raw content into wiki pages. Delegates semantic processing to the AI agent.',
    usage: '/memex:ingest [target]',
    shellCmd: 'memex ingest $ARGS',
    workflow: 'Ingest',
    reference: 'references/ingest-workflow.md',
    cliHint: 'Use `memex search` to find related pages and `memex lint` after substantial edits.',
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
    workflow: 'Distill',
    reference: 'references/distill-workflow.md',
    cliHint: 'If no input is provided, use `memex distill --latest --agent <current-agent>` to capture the current agent session.',
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
    name: 'query',
    description: 'Answer from the durable memex wiki using the ai-memex query workflow.',
    usage: '/memex:query <question>',
    shellCmd: 'memex search $ARGS',
    workflow: 'Query',
    reference: 'references/query-workflow.md',
    cliHint: 'Use `memex search` to narrow candidate wiki pages, then answer with citations.',
    examples: [
      '/memex:query "what do I know about agent memory tradeoffs?"',
      '/memex:query "how did we decide CLI vs skill boundaries?"',
    ],
  },
  {
    name: 'status',
    description: 'Show vault overview: page count, scenes, recent activity.',
    usage: '/memex:status',
    shellCmd: 'memex status',
    workflow: 'Status',
    reference: 'references/vault-protocol.md',
    cliHint: 'Run `memex status`, then summarize the vault state and likely next step.',
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
    description: 'Two-layer wiki health check: CLI mechanical pass (orphans, broken links, frontmatter) plus agent-driven semantic pass (contradictions, stale claims, missing cross-references, concepts without pages, data gaps, suggested next sources). Apply safe fixes directly, file unresolved findings as a wiki page.',
    usage: '/memex:lint [--scene <scene>] [--json]',
    shellCmd: 'memex lint $ARGS',
    workflow: 'Lint',
    reference: 'references/lint-workflow.md',
    cliHint: 'Start with `memex lint --json` for the mechanical baseline, then scan the wiki for the 6 semantic categories. File anything unresolved to `summaries/lint-report-YYYY-MM-DD.md` and append `log.md`.',
    examples: [
      '/memex:lint',
      '/memex:lint --scene team',
      '/memex:lint --json',
    ],
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

function skillInstallRoot(projectDir: string, agentType: string): string | null {
  switch (agentType) {
    case 'claude-code':
      return join(projectDir, '.claude', 'skills', 'ai-memex').replace(/\\/g, '/');
    case 'codex':
      return join(projectDir, '.codex', 'skills', 'ai-memex').replace(/\\/g, '/');
    default:
      return null;
  }
}

function codexHomeDir(): string {
  return (process.env.CODEX_HOME || join(homedir(), '.codex')).replace(/\\/g, '/');
}

function codexPromptsDir(): string {
  return join(codexHomeDir(), 'prompts').replace(/\\/g, '/');
}

async function loadAiMemexSkillFiles(projectDir: string, agentType: string): Promise<HookFile[]> {
  const currentFile = fileURLToPath(import.meta.url);
  const templateRoot = join(dirname(currentFile), '..', '..', 'templates', 'skills', 'ai-memex');
  if (!(await pathExists(templateRoot))) return [];
  const targetRoot = skillInstallRoot(projectDir, agentType);
  if (!targetRoot) return [];

  const files: HookFile[] = [];
  await collectTemplateFiles(templateRoot, templateRoot, targetRoot, files);
  return files;
}

async function collectTemplateFiles(
  root: string,
  dir: string,
  targetRoot: string,
  files: HookFile[],
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectTemplateFiles(root, fullPath, targetRoot, files);
      continue;
    }
    if (!entry.isFile()) continue;

    const relativePath = fullPath.slice(root.length + 1).replace(/\\/g, '/');
    files.push({
      path: join(targetRoot, relativePath).replace(/\\/g, '/'),
      content: await readFile(fullPath, 'utf-8'),
      description: `ai-memex skill ${relativePath}`,
    });
  }
}

function agentRuntimeHint(agentType: string): string {
  return `Current memex agent: \`${agentType}\`

When calling a memex CLI command that delegates semantic work to an agent, pass \`--agent ${agentType}\` unless the user already provided an explicit \`--agent\`.`;
}

/**
 * Remove .md files in `dir` whose basename is not in `expected`.
 * Used to clean up slash-command / skill-reference files left behind when a
 * MEMEX_COMMANDS entry or skill reference is removed between installs.
 * No-op when dir does not exist.
 */
async function pruneStaleHookFiles(
  dir: string,
  expected: Set<string>,
  label: string,
): Promise<void> {
  if (!(await pathExists(dir))) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const basename = entry.name.replace(/\.md$/, '');
    if (expected.has(basename)) continue;
    const fullPath = join(dir, entry.name).replace(/\\/g, '/');
    await rm(fullPath, { force: true });
    logger.info(`Pruned stale ${label}: ${fullPath}`);
  }
}

function buildClaudeCodeCommandFile(cmd: MemexCommand, agentType: string): string {
  if (cmd.workflow) {
    return `# memex ${cmd.name}

${cmd.description}

## Usage

\`${cmd.usage}\`

## Examples

${cmd.examples.map(e => `- \`${e}\``).join('\n')}

## Instructions

Use the installed \`ai-memex\` skill.

- Workflow: ${cmd.workflow}
- Reference: \`${cmd.reference}\`
- User arguments: \`$ARGS\`
- Current agent: \`${agentType}\`
- CLI hint: ${cmd.cliHint}

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass \`--agent ${agentType}\` unless the user already provided an explicit \`--agent\`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call \`memex\` CLI primitives only when useful.
`;
  }

  return `# memex ${cmd.name}

${cmd.description}

## Usage

\`${cmd.usage}\`

## Examples

${cmd.examples.map(e => `- \`${e}\``).join('\n')}

## Instructions

${agentRuntimeHint(agentType)}

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

## Recommended agent-native workflows

- \`/memex:capture\` — capture sources into raw/
- \`/memex:ingest\` — compile raw material into wiki pages
- \`/memex:query\` — answer from the durable wiki
- \`/memex:distill\` — save useful conversations as raw session material
- \`/memex:lint\` — health-check the wiki (mechanical + semantic)
- \`/memex:status\` — inspect vault state

## Compatible CLI shortcuts

${MEMEX_COMMANDS.map(cmd => `- \`/memex:${cmd.name}\` — ${cmd.description}`).join('\n')}

## Quick start

\`\`\`
/memex:status                                # see what's in the knowledge base
/memex:capture https://docs.example.com      # capture documentation
/memex:ingest                                # process raw files into wiki pages
/memex:query "topic"                         # answer from durable wiki knowledge
/memex:distill                               # distill useful session knowledge
/memex:lint                                  # health-check (mechanical + semantic)
\`\`\`
`;
}

function generateClaudeCodeHooks(projectDir: string, agentType = 'claude-code'): HookFile[] {
  const commandsDir = join(projectDir, '.claude', 'commands', 'memex').replace(/\\/g, '/');
  const files: HookFile[] = [];

  for (const cmd of MEMEX_COMMANDS) {
    files.push({
      path: join(commandsDir, `${cmd.name}.md`).replace(/\\/g, '/'),
      content: buildClaudeCodeCommandFile(cmd, agentType),
      description: `/memex:${cmd.name}`,
    });
  }

  files.push({
    path: join(commandsDir, 'help.md').replace(/\\/g, '/'),
    content: buildClaudeCodeHelpFile(),
    description: '/memex:help',
  });

  return files;
}

// ── OpenCode command file generator ──────────────────────────────────────────

function buildCodexPromptFile(cmd: MemexCommand, agentType = 'codex'): string {
  if (cmd.workflow) {
    return `---
description: "${cmd.description}"
---

# memex ${cmd.name}

${cmd.description}

Use the installed \`ai-memex\` skill.

- Workflow: ${cmd.workflow}
- Reference: \`${cmd.reference}\`
- User arguments: \`$ARGUMENTS\`
- Current agent: \`${agentType}\`
- CLI hint: ${cmd.cliHint}

When the workflow calls a memex CLI command that delegates semantic work to an agent, pass \`--agent ${agentType}\` unless the user already provided an explicit \`--agent\`.

Do not treat this slash command as a raw shell shortcut. Let the skill choose the workflow, read the relevant reference, and call \`memex\` CLI primitives only when useful.
`;
  }

  return `---
description: "${cmd.description}"
---

# memex ${cmd.name}

${cmd.description}

${agentRuntimeHint(agentType)}

Run the following shell command, substituting \`$ARGUMENTS\` with any arguments
the user provided after the slash command:

\`\`\`bash
${cmd.shellCmd.replace('$ARGS', '$ARGUMENTS')}
\`\`\`

Report the command output to the user. If the command modifies wiki pages,
briefly summarize what changed.
`;
}

function buildCodexHelpPromptFile(): string {
  return `---
description: "Show all available ai-memex workflows and CLI shortcuts."
---

# memex help

Use the installed \`ai-memex\` skill when the user wants a semantic workflow.

## Recommended workflows

- \`/memex:capture\` - capture sources into raw/
- \`/memex:ingest\` - compile raw material into wiki pages
- \`/memex:query\` - answer from the durable wiki
- \`/memex:distill\` - save useful conversations as raw session material
- \`/memex:lint\` - health-check the wiki (mechanical + semantic)
- \`/memex:status\` - inspect vault state

## CLI shortcuts

${MEMEX_COMMANDS.map(cmd => `- \`${cmd.shellCmd.replace('$ARGS', '[args]')}\` - ${cmd.description}`).join('\n')}
`;
}

function generateCodexPromptFiles(agentType = 'codex'): HookFile[] {
  const promptsDir = join(codexPromptsDir(), 'memex').replace(/\\/g, '/');
  const files: HookFile[] = MEMEX_COMMANDS.map((cmd) => ({
    path: join(promptsDir, `${cmd.name}.md`).replace(/\\/g, '/'),
    content: buildCodexPromptFile(cmd, agentType),
    description: `/memex:${cmd.name}`,
  }));

  files.push({
    path: join(promptsDir, 'help.md').replace(/\\/g, '/'),
    content: buildCodexHelpPromptFile(),
    description: '/memex:help',
  });

  // Codex currently discovers top-level prompt files reliably. Keep the
  // nested files for agents that support namespaced prompts, and add stable
  // top-level aliases that work on Windows where ":" cannot be used in names.
  for (const cmd of MEMEX_COMMANDS) {
    files.push({
      path: join(codexPromptsDir(), `memex-${cmd.name}.md`).replace(/\\/g, '/'),
      content: buildCodexPromptFile(cmd, agentType),
      description: `/memex-${cmd.name}`,
    });
  }

  files.push({
    path: join(codexPromptsDir(), 'memex-help.md').replace(/\\/g, '/'),
    content: buildCodexHelpPromptFile(),
    description: '/memex-help',
  });

  return files;
}

function generateOpenCodeHooks(projectDir: string, agentType = 'opencode'): HookFile[] {
  const commandsDir = join(projectDir, '.opencode', 'commands').replace(/\\/g, '/');
  return MEMEX_COMMANDS.map(cmd => ({
    path: join(commandsDir, `memex-${cmd.name}.md`).replace(/\\/g, '/'),
    content: `---
name: memex-${cmd.name}
description: "${cmd.description}"
---

# memex ${cmd.name}

${cmd.description}

${agentRuntimeHint(agentType)}

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

function generateGeminiCliHooks(projectDir: string, agentType = 'gemini-cli'): HookFile[] {
  const commandsDir = join(projectDir, '.gemini', 'commands').replace(/\\/g, '/');
  return MEMEX_COMMANDS.map(cmd => ({
    path: join(commandsDir, `memex-${cmd.name}.md`).replace(/\\/g, '/'),
    content: `# /memex:${cmd.name}

${cmd.description}

${agentRuntimeHint(agentType)}

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

function generateCursorHooks(projectDir: string, agentType = 'cursor'): HookFile[] {
  const content = `---
description: memex knowledge base commands — use these to manage the LLM wiki
globs: ["**/*"]
alwaysApply: false
---

# memex Knowledge Base Commands

You have access to the \`memex\` CLI for managing a persistent knowledge base.
Use these commands proactively to store and retrieve knowledge across sessions.

${agentRuntimeHint(agentType)}

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

function buildAgentsMdSection(agentType = 'codex'): string {
  return `
## Memex Knowledge Base Commands

You have access to the \`memex\` CLI for managing a persistent knowledge base (LLM Wiki).
Use these commands to store and retrieve knowledge across sessions.

${agentRuntimeHint(agentType)}

${agentType === 'codex' ? `### Codex Entry Points

Codex custom slash prompts are installed at:

\`${codexPromptsDir()}/memex/*.md\`

After restarting Codex, use the top-level aliases:

- \`/memex-capture <source>\`
- \`/memex-ingest [target]\`
- \`/memex-query <question>\`
- \`/memex-distill [input]\`
- \`/memex-repair\`
- \`/memex-status\`

If your Codex build supports namespaced prompt folders, the original \`/memex:*\`
form may also work. The \`/memex-*\` aliases are the compatibility path.

For \`/memex:distill\` without an explicit input, run \`memex distill --latest --agent codex\` so the current Codex session directory is used.
` : ''}

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
  const scope = options.scope ?? 'project';
  const projectDir = resolveInstallBaseDir(options, cwd);
  const agentType = (options.agent ?? 'claude-code') as string;

  logger.info(`Installing memex slash commands for: ${agentType}`);
  logger.info(`Install scope: ${scope}`);
  logger.info(`${scope === 'user' ? 'User directory' : 'Project directory'}: ${projectDir}`);

  // ── codex / generic: append to AGENTS.md ─────────────────────────────────
  if (agentType === 'codex') {
    const agentsMdPath = join(projectDir, 'AGENTS.md').replace(/\\/g, '/');
    const section = buildAgentsMdSection(agentType);
    const promptFiles = generateCodexPromptFiles(agentType);
    const skillFiles = await loadAiMemexSkillFiles(projectDir, agentType);

    if (options.dryRun) {
      if (scope === 'project') {
      logger.info(`Would append to: ${agentsMdPath}`);
      }
      logger.info(`Would create ${promptFiles.length} Codex prompt file(s) under ${codexPromptsDir()}`);
      logger.info(`Would create ${skillFiles.length} Codex skill file(s) under ${projectDir}/.codex/skills/ai-memex`);
      console.log('\n--- AGENTS.md section ---\n');
      console.log(section);
      console.log('--- END ---\n');
      return;
    }

    if (scope === 'project') {
      let existing = '';
      if (await pathExists(agentsMdPath)) {
        existing = await readFile(agentsMdPath, 'utf-8');
        if (existing.includes('## Memex Knowledge Base Commands')) {
          logger.warn('AGENTS.md already has a memex section. Skipping AGENTS.md update.');
        } else {
          await writeFileUtf8(agentsMdPath, existing + '\n' + section);
          logger.success(`Updated ${agentsMdPath}`);
        }
      } else {
        existing = '# Agent Instructions\n';
        await writeFileUtf8(agentsMdPath, existing + '\n' + section);
        logger.success(`Updated ${agentsMdPath}`);
      }
    }

    const expectedCodexPrompts = new Set(
      promptFiles
        .filter((f) => f.path.includes('/prompts/memex/'))
        .map((f) => f.path.split('/').pop()!.replace(/\.md$/, '')),
    );
    if (expectedCodexPrompts.size > 0) {
      await pruneStaleHookFiles(
        join(codexPromptsDir(), 'memex').replace(/\\/g, '/'),
        expectedCodexPrompts,
        'codex prompt',
      );
    }

    for (const f of [...promptFiles, ...skillFiles]) {
      const dir = f.path.substring(0, f.path.lastIndexOf('/'));
      await mkdir(dir, { recursive: true });
      await writeFileUtf8(f.path, f.content);
      logger.success(`Created: ${f.path}`);
    }

    printUsageHint(agentType);
    return;
  }

  // ── File-based agents ─────────────────────────────────────────────────────
  if (agentType === 'generic') {
    const agentsMdPath = join(projectDir, 'AGENTS.md').replace(/\\/g, '/');
    const section = buildAgentsMdSection(agentType);

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

  let files: HookFile[] = [];

  switch (agentType) {
    case 'claude-code':
      files = generateClaudeCodeHooks(projectDir, agentType);
      files.push(...await loadAiMemexSkillFiles(projectDir, agentType));
      break;
    case 'opencode':
      files = generateOpenCodeHooks(projectDir, agentType);
      break;
    case 'gemini-cli':
      files = generateGeminiCliHooks(projectDir, agentType);
      break;
    case 'cursor':
      files = generateCursorHooks(projectDir, agentType);
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

  // Prune slash-command / skill-reference files left over from prior installs
  // (e.g. a MEMEX_COMMANDS entry or skill reference that was removed).
  if (agentType === 'claude-code') {
    const expectedCommands = new Set(
      files
        .filter((f) => f.path.includes('/.claude/commands/memex/'))
        .map((f) => f.path.split('/').pop()!.replace(/\.md$/, '')),
    );
    if (expectedCommands.size > 0) {
      await pruneStaleHookFiles(
        join(projectDir, '.claude', 'commands', 'memex').replace(/\\/g, '/'),
        expectedCommands,
        'slash command',
      );
    }

    const expectedReferences = new Set(
      files
        .filter((f) => f.path.includes('/.claude/skills/ai-memex/references/'))
        .map((f) => f.path.split('/').pop()!.replace(/\.md$/, '')),
    );
    if (expectedReferences.size > 0) {
      await pruneStaleHookFiles(
        join(projectDir, '.claude', 'skills', 'ai-memex', 'references').replace(/\\/g, '/'),
        expectedReferences,
        'skill reference',
      );
    }
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

  logger.info(`\nInstalled ${created} file(s) for ${agentType}.`);
  printUsageHint(agentType);
}

// ── Usage hints ───────────────────────────────────────────────────────────────

function printUsageHint(agentType: string): void {
  console.log();
  switch (agentType) {
    case 'claude-code':
      logger.info('In your Claude Code session, type:');
      console.log('  ai-memex skill       - installed at .claude/skills/ai-memex');
      console.log('  /memex:help            — show all commands');
      console.log('  /memex:status          — vault overview');
      console.log('  /memex:capture <url>   — capture sources into raw/');
      console.log('  /memex:ingest          — compile raw files into wiki pages');
      console.log('  /memex:query "topic"   — answer from durable wiki knowledge');
      console.log('  /memex:distill         — distill useful session knowledge');
      console.log('  /memex:lint            — health-check (mechanical + semantic)');
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
      logger.info('In your Codex CLI session, restart Codex and type:');
      console.log('  /memex:help');
      console.log('  /memex:status');
      console.log('  /memex:capture <url>');
      console.log('  /memex:ingest');
      console.log('  /memex:query "topic"');
      console.log('  /memex:distill');
      console.log('  Compatibility aliases if /memex:* is not listed:');
      console.log('  /memex-help');
      console.log('  /memex-status');
      console.log('  /memex-capture <url>');
      console.log('  /memex-ingest');
      console.log('  /memex-query "topic"');
      console.log('  /memex-distill');
      console.log(`  prompts installed at ${codexPromptsDir()}`);
      break;
    case 'generic':
      logger.info('The agent will now use memex commands when appropriate.');
      logger.info('You can also ask explicitly: "run memex search <topic>"');
      break;
  }
  console.log();
  logger.info('Install for another agent:  memex install-hooks --agent <agent>');
  logger.info('See all agents:             memex config agents');
}
