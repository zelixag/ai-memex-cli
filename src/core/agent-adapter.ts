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
 *   opencode      opencode-ai                → OPENCODE.md
 *   cursor        Cursor IDE agent           → .cursorrules
 *   gemini-cli    @google/gemini-cli         → GEMINI.md
 *   aider         aider-chat                 → .aider.conf.yml context
 *   continue      Continue.dev               → .continue/config.json context
 *   generic       Any OpenAI-compatible CLI  → AGENTS.md
 */

import { commandExists } from '../utils/exec.js';
import { pathExists } from '../utils/fs.js';
import { join } from 'node:path';

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
    sessionPattern: '**/*.json',
    sessionHint: '~/.codex/sessions/*.json',
  },
  'opencode': {
    name: 'OpenCode',
    bin: 'opencode',
    altBins: ['oc'],
    contextFile: 'OPENCODE.md',
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
  if (await commandExists(profile.bin)) return profile.bin;
  for (const alt of profile.altBins ?? []) {
    if (await commandExists(alt)) return alt;
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
