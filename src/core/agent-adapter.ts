/**
 * agent-adapter.ts
 *
 * Universal Agent Adapter Layer for ai-memex-cli.
 *
 * Each AI coding agent has its own:
 *   - CLI binary and invocation style
 *   - Context file name (CLAUDE.md, AGENTS.md, .cursorrules, etc.)
 *   - Prompt format preferences
 *   - Allowed tools / flags
 *
 * Supported agents:
 *   claude-code   @anthropic-ai/claude-code  → CLAUDE.md
 *   codex         @openai/codex              → AGENTS.md
 *   opencode      opencode-ai                → AGENTS.md (OpenCode rules; see opencode.ai/docs/rules)
 *   cursor        Cursor IDE agent           → .cursorrules
 *   gemini-cli    @google/gemini-cli         → GEMINI.md
 *   aider         aider-chat                 → .aider.conf.yml context
 *   continue      Continue.dev               → .continue/config.json context
 *   generic       Any OpenAI-compatible CLI  → AGENTS.md
 */

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resolveCommandPath } from '../utils/exec.js';
import { pathExists } from '../utils/fs.js';

// ── Agent Registry ────────────────────────────────────────────────────────────

export type AgentId =
  | 'claude-code'
  | 'codex'
  | 'opencode'
  | 'cursor'
  | 'gemini-cli'
  | 'aider'
  | 'continue'
  | 'generic';

export interface AgentProfile {
  /** Human-readable name */
  name: string;
  /** CLI binary to invoke */
  bin: string;
  /** Alternative binary names to try */
  altBins?: string[];
  /** Context file name this agent reads */
  contextFile: string;
  /** Additional context files to generate (optional) */
  extraContextFiles?: string[];
  /** How to pass a prompt to this agent */
  promptMode: 'flag' | 'stdin' | 'file' | 'arg';
  /** Flag used to pass prompt (if promptMode === 'flag') */
  promptFlag?: string;
  /** Extra CLI args always appended */
  extraArgs?: string[];
  /** Install hint shown when binary not found */
  installHint: string;
  /** Whether this agent supports non-interactive headless mode */
  headless: boolean;
  /** Short description */
  description: string;
  /**
   * Session directory path relative to user home (~).
   * Where this agent stores conversation/session data.
   * Uses forward slashes; resolved at runtime with os.homedir().
   */
  sessionDir?: string;
  /**
   * Glob pattern to match session files inside sessionDir.
   * e.g. '** / *.jsonl' or '** / *.json'
   */
  sessionPattern?: string;
  /**
   * Human-readable description of session location for onboard display.
   */
  sessionHint?: string;
}

export const AGENT_PROFILES: Record<AgentId, AgentProfile> = {
  'claude-code': {
    name: 'Claude Code',
    bin: 'claude',
    contextFile: 'CLAUDE.md',
    promptMode: 'flag',
    promptFlag: '-p',
    extraArgs: ['--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep,WebFetch'],
    installHint: 'npm install -g @anthropic-ai/claude-code',
    headless: true,
    description: 'Anthropic Claude Code CLI agent',
    sessionDir: '.claude/projects',
    sessionPattern: '**/*.jsonl',
    sessionHint: '~/.claude/projects/<project>/*.jsonl',
  },
  'codex': {
    name: 'OpenAI Codex',
    bin: 'codex',
    contextFile: 'AGENTS.md',
    promptMode: 'flag',
    promptFlag: '-q',
    extraArgs: ['--approval-mode', 'auto-edit'],
    installHint: 'npm install -g @openai/codex',
    headless: true,
    description: 'OpenAI Codex CLI agent',
    sessionDir: '.codex/sessions',
    sessionPattern: '**/*.jsonl',
    sessionHint: '~/.codex/sessions/**/*.jsonl',
  },
  'opencode': {
    name: 'OpenCode',
    bin: 'opencode',
    altBins: ['oc'],
    contextFile: 'AGENTS.md',
    promptMode: 'arg',
    extraArgs: ['run'],
    installHint: 'npm install -g opencode-ai  (or: curl ... | sh)',
    headless: true,
    description: 'OpenCode AI coding agent',
    sessionDir: '.opencode/sessions',
    sessionPattern: '**/*.jsonl',
    sessionHint: '~/.opencode/sessions/*.jsonl',
  },
  'cursor': {
    name: 'Cursor',
    bin: 'cursor',
    contextFile: '.cursorrules',
    extraContextFiles: ['.cursor/rules'],
    promptMode: 'flag',
    promptFlag: '--message',
    extraArgs: ['--headless'],
    installHint: 'Install Cursor from https://cursor.sh',
    headless: false, // Cursor is GUI-based; headless support is limited
    description: 'Cursor IDE AI agent',
  },
  'gemini-cli': {
    name: 'Gemini CLI',
    bin: 'gemini',
    altBins: ['gemini-cli'],
    contextFile: 'GEMINI.md',
    promptMode: 'flag',
    promptFlag: '-p',
    installHint: 'npm install -g @google/gemini-cli',
    headless: true,
    description: 'Google Gemini CLI agent',
    sessionDir: '.gemini/sessions',
    sessionPattern: '**/*.json',
    sessionHint: '~/.gemini/sessions/*.json',
  },
  'aider': {
    name: 'Aider',
    bin: 'aider',
    contextFile: '.aider.conf.yml',
    promptMode: 'flag',
    promptFlag: '--message',
    extraArgs: ['--yes', '--no-git'],
    installHint: 'pip install aider-chat',
    headless: true,
    description: 'Aider AI pair programming tool',
    sessionDir: '.aider/history',
    sessionPattern: '**/*.md',
    sessionHint: '~/.aider/history/*.md',
  },
  'continue': {
    name: 'Continue.dev',
    bin: 'continue',
    contextFile: '.continue/config.json',
    promptMode: 'stdin',
    installHint: 'Install Continue extension in VS Code / JetBrains',
    headless: false,
    description: 'Continue.dev AI coding assistant',
  },
  'generic': {
    name: 'Generic Agent',
    bin: 'llm',
    altBins: ['sgpt', 'aichat', 'ai'],
    contextFile: 'AGENTS.md',
    promptMode: 'arg',
    installHint: 'pip install llm  (or any OpenAI-compatible CLI)',
    headless: true,
    description: 'Generic OpenAI-compatible CLI agent',
  },
};

/** Markdown wiki-constitution files recognized at a vault root (any one suffices). */
export const VAULT_SCHEMA_MARKDOWN_FILENAMES = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
] as const;

export function isKnownAgentId(id: string): id is AgentId {
  return Object.prototype.hasOwnProperty.call(AGENT_PROFILES, id);
}

/**
 * Basename for the wiki schema file when initializing a **global** vault:
 * the agent's `contextFile` when it is a single `*.md` in the vault root,
 * otherwise `AGENTS.md` (e.g. Cursor / Aider use non-md project context paths).
 */
export function vaultSchemaFilenameForAgent(agentId: AgentId): string {
  const cf = AGENT_PROFILES[agentId]?.contextFile ?? 'AGENTS.md';
  if (/^[^\\/]+\.md$/i.test(cf)) return cf;
  return 'AGENTS.md';
}

// ── Agent Resolution ──────────────────────────────────────────────────────────

/**
 * Resolve an agent by ID or auto-detect from installed binaries.
 */
export async function resolveAgent(
  agentId?: string
): Promise<{ profile: AgentProfile; id: AgentId; resolvedBin: string } | null> {
  if (agentId) {
    const id = agentId as AgentId;
    const profile = AGENT_PROFILES[id];
    if (!profile) {
      return null; // unknown agent
    }
    const bin = await findBin(profile);
    if (!bin) return null;
    return { profile, id, resolvedBin: bin };
  }

  // Auto-detect: try agents in priority order
  const priority: AgentId[] = ['claude-code', 'codex', 'opencode', 'gemini-cli', 'aider', 'generic'];
  for (const id of priority) {
    const profile = AGENT_PROFILES[id];
    const bin = await findBin(profile);
    if (bin) {
      return { profile, id, resolvedBin: bin };
    }
  }
  return null;
}

async function findBin(profile: AgentProfile): Promise<string | null> {
  const resolved = await resolveCommandPath(profile.bin);
  if (resolved) return resolved;
  for (const alt of profile.altBins ?? []) {
    const altResolved = await resolveCommandPath(alt);
    if (altResolved) return altResolved;
  }
  return null;
}

// ── Prompt Building ───────────────────────────────────────────────────────────

/**
 * Build the CLI args array to invoke an agent with a given prompt.
 */
export function buildAgentArgs(
  profile: AgentProfile,
  resolvedBin: string,
  prompt: string
): string[] {
  switch (profile.promptMode) {
    case 'flag':
      return [
        ...(profile.extraArgs ?? []),
        profile.promptFlag!,
        prompt,
      ];
    case 'arg':
      return [
        ...(profile.extraArgs ?? []),
        prompt,
      ];
    case 'stdin':
    case 'file':
      // For stdin/file modes, caller should handle separately
      return [...(profile.extraArgs ?? [])];
    default:
      return [prompt];
  }
}

/** True when Node will spawn via cmd.exe (8191-char line budget on Windows). */
export function agentInvokesViaWindowsCmdShell(
  resolvedBin: string,
  platform: NodeJS.Platform = process.platform
): boolean {
  return platform === 'win32' && /\.(cmd|bat|ps1)$/i.test(resolvedBin);
}

/**
 * Rough size of the prompt-bearing argv tail for `promptMode: 'flag'`.
 * Used to avoid Windows cmd.exe "command line too long" failures.
 */
export function estimateFlagModeArgvChars(profile: AgentProfile, prompt: string): number {
  if (profile.promptMode !== 'flag' || !profile.promptFlag) return prompt.length;
  const parts = [...(profile.extraArgs ?? []), profile.promptFlag, prompt];
  let n = 0;
  for (const p of parts) n += p.length;
  // Space + quoting overhead per argument when cmd builds the inner command string
  return n + parts.length * 4 + 96;
}

/**
 * Whether the full prompt must not be passed as a single CLI argument (Windows
 * `shell: true` + `.cmd` shims, or very large argv on any OS).
 */
export function shouldSpillPromptToFile(
  profile: AgentProfile,
  prompt: string,
  resolvedBin: string,
  platform: NodeJS.Platform = process.platform
): boolean {
  if (profile.promptMode !== 'flag' || !profile.promptFlag) return false;
  const est = estimateFlagModeArgvChars(profile, prompt) + resolvedBin.length;
  if (platform === 'win32') {
    if (agentInvokesViaWindowsCmdShell(resolvedBin, platform)) return est > 6500;
    return est > 24000;
  }
  return est > 256000;
}

export interface PreparedAgentPromptArgs {
  args: string[];
  /** Remove temp prompt file/dir; call in `finally` after the child exits. */
  cleanup: () => void;
  /** String actually passed as the prompt CLI argument (full prompt or short wrapper). */
  argvPromptValue: string;
  usedPromptFile: boolean;
}

function buildPromptFileWrapperInstruction(absolutePath: string): string {
  const p = absolutePath.replace(/\\/g, '/');
  return [
    'You are running a memex CLI–delegated task.',
    'Open the following UTF-8 Markdown file with your Read tool and follow every instruction inside exactly.',
    'Do not paste the entire file into the terminal.',
    '',
    'Instruction file:',
    p,
  ].join('\n');
}

/**
 * Builds argv for an agent, writing the prompt to a temp `.md` file when the
 * Windows cmd.exe line limit (or other argv size limits) would be exceeded.
 */
export function prepareAgentPromptArgs(
  profile: AgentProfile,
  resolvedBin: string,
  prompt: string,
  opts?: { taskSlug?: string; platform?: NodeJS.Platform }
): PreparedAgentPromptArgs {
  const platform = opts?.platform ?? process.platform;
  if (!shouldSpillPromptToFile(profile, prompt, resolvedBin, platform)) {
    return {
      args: buildAgentArgs(profile, resolvedBin, prompt),
      cleanup: () => {},
      argvPromptValue: prompt,
      usedPromptFile: false,
    };
  }
  const slug = (opts?.taskSlug ?? 'memex-prompt').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  const dir = mkdtempSync(join(tmpdir(), 'memex-agent-'));
  const file = join(dir, `${slug}.md`);
  writeFileSync(file, prompt, 'utf8');
  const wrapper = buildPromptFileWrapperInstruction(file);
  return {
    args: buildAgentArgs(profile, resolvedBin, wrapper),
    cleanup: () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    },
    argvPromptValue: wrapper,
    usedPromptFile: true,
  };
}

// ── Context File Management ───────────────────────────────────────────────────

/**
 * Get all context file paths for a given agent in a vault.
 */
export function getContextFilePaths(profile: AgentProfile, vaultPath: string): string[] {
  const files = [join(vaultPath, profile.contextFile).replace(/\\/g, '/')];
  for (const extra of profile.extraContextFiles ?? []) {
    files.push(join(vaultPath, extra).replace(/\\/g, '/'));
  }
  return files;
}

/**
 * List all installed agents on the current machine.
 */
export async function detectInstalledAgents(): Promise<Array<{ id: AgentId; profile: AgentProfile; bin: string }>> {
  const installed: Array<{ id: AgentId; profile: AgentProfile; bin: string }> = [];
  for (const [id, profile] of Object.entries(AGENT_PROFILES) as [AgentId, AgentProfile][]) {
    const bin = await findBin(profile);
    if (bin) {
      installed.push({ id, profile, bin });
    }
  }
  return installed;
}

/**
 * Print a formatted list of all supported agents with install status.
 */
export async function printAgentTable(): Promise<void> {
  const { logger } = await import('../utils/logger.js');
  logger.info('Supported agents:\n');

  const rows: string[][] = [];
  for (const [id, profile] of Object.entries(AGENT_PROFILES) as [AgentId, AgentProfile][]) {
    const bin = await findBin(profile);
    const status = bin ? '\x1b[32m✓ installed\x1b[0m' : '\x1b[2mnot found\x1b[0m';
    rows.push([
      `  \x1b[36m${id}\x1b[0m`,
      profile.contextFile,
      status,
      profile.installHint,
    ]);
  }

  const colWidths = [20, 22, 20];
  for (const row of rows) {
    const line = row.slice(0, 3).map((cell, i) => cell.padEnd(colWidths[i] ?? 0)).join('  ') + '  ' + row[3];
    console.log(line);
  }
  console.log();
}
