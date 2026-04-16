/**
 * distill.ts
 *
 * `memex distill [input]`
 *
 * Distill a conversation session (JSONL or plain text) into a raw wiki document.
 * The agent extracts best practices, decisions, and knowledge from the session.
 *
 * KEY DESIGN PRINCIPLE:
 *   Like ingest, the CLI only builds the prompt. The agent uses its own
 *   file tools to find and read the input. Fuzzy paths and natural language
 *   descriptions are fully supported.
 *
 * Examples:
 *   memex distill session.jsonl           → distill a JSONL session file
 *   memex distill ~/Downloads/chat.json   → tilde path
 *   memex distill .\sessions\today.jsonl  → Windows relative path
 *   memex distill "today's session"       → natural language (agent searches)
 *   memex distill --role backend-engineer → extract role-specific best practices
 *   memex distill --agent codex           → use Codex instead of default
 *   memex distill --no-llm session.jsonl  → mechanical extraction only
 */

import { resolveGlobalVaultPath } from '../core/vault.js';
import { readFileUtf8, writeFileUtf8, pathExists, normalizePath } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { parseJsonlLines, mechanicalExtract, buildDistillPrompt } from '../core/distiller.js';
import { runCommand } from '../utils/exec.js';
import { readConfig } from '../core/config.js';
import { resolveAgent, buildAgentArgs, printAgentTable, AGENT_PROFILES, type AgentId } from '../core/agent-adapter.js';
import { readGlobalConfig } from '../core/config.js';
import { basename, join } from 'node:path';
import { homedir } from 'node:os';

export interface DistillOptions {
  /**
   * Input hint: path to JSONL/JSON/text file, or natural language description.
   * If omitted, agent will look for recent session files.
   */
  input?: string;
  /** Output path for the distilled markdown */
  out?: string;
  /** Role/persona to extract best practices for (e.g., backend-engineer, tech-lead) */
  role?: string;
  /** Skip LLM, use mechanical extraction only */
  noLlm?: boolean;
  /** Override agent */
  agent?: string;
  /** Print prompt only, don't execute */
  dryRun?: boolean;
  /** Explicit vault path */
  vault?: string;
  /** Auto-discover and use the latest session file from the agent's session directory */
  latest?: boolean;
}

export async function distillCommand(options: DistillOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);
  const date = new Date().toISOString().split('T')[0];

  // ── No-LLM mechanical mode ────────────────────────────────────────────────
  // Only available when we have a concrete file path
  if (options.noLlm) {
    await mechanicalDistill(options, vault, cwd, date);
    return;
  }

  // ── Resolve agent ─────────────────────────────────────────────────────────
  const agentIdHint = options.agent ?? config.distill.agent;
  const agentResult = await resolveAgent(agentIdHint);

  if (!agentResult && !options.dryRun) {
    logger.error('No AI agent found. Install one of the following:');
    await printAgentTable();
    logger.info('Then set your default: memex config set agent claude-code');
    logger.info('Or use --no-llm for mechanical extraction (requires a concrete file path).');
    return;
  }

  const profile = agentResult?.profile ?? AGENT_PROFILES['claude-code'];
  const resolvedBin = agentResult?.resolvedBin ?? 'claude';

  // ── Resolve agent from global config if not explicitly set ────────────────
  const globalCfg = await readGlobalConfig();
  const agentIdResolved = agentResult?.id ?? (globalCfg.agent as AgentId) ?? (agentIdHint as AgentId) ?? undefined;
  const configSessionDir = (globalCfg as Record<string, unknown>).sessionDir as string | undefined;

  // ── Build target hint ─────────────────────────────────────────────────────
  const inputHint = await buildInputHint(options.input, vault, cwd, {
    latest: options.latest,
    agentId: agentIdResolved,
    configSessionDir,
  });

  // ── Read vault context ────────────────────────────────────────────────────
  const agentsPath = join(vault, 'AGENTS.md').replace(/\\/g, '/');
  const agentsContent = (await pathExists(agentsPath)) ? await readFileUtf8(agentsPath) : '';
  const indexPath = join(vault, 'index.md').replace(/\\/g, '/');
  const indexContent = (await pathExists(indexPath)) ? await readFileUtf8(indexPath) : '';

  // ── Determine output path ─────────────────────────────────────────────────
  const inputSlug = options.input
    ? basename(options.input).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
    : 'session';
  const outPath = options.out ?? join(vault, 'raw', 'sessions', `session-${date}-${inputSlug}.md`).replace(/\\/g, '/');

  // ── Build prompt ──────────────────────────────────────────────────────────
  const prompt = buildAgentDistillPrompt({
    inputHint,
    outPath,
    vault,
    role: options.role,
    agentsContent,
    indexContent,
    contextFile: profile.contextFile,
    date,
  });

  if (options.dryRun) {
    logger.info(`Agent: ${profile.name} (${resolvedBin})`);
    logger.info(`Input hint: ${inputHint}`);
    logger.info(`Output: ${outPath}`);
    console.log('\n--- PROMPT ---\n');
    console.log(prompt);
    console.log('\n--- END PROMPT ---');
    return;
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  logger.info(`Distilling with ${profile.name}...`);
  logger.info(`Input: ${inputHint}`);
  logger.info(`Output: ${outPath}`);

  const args = buildAgentArgs(profile, resolvedBin, prompt);

  try {
    const { stdout, stderr } = await runCommand(resolvedBin, args, { cwd: vault });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    logger.success(`Distilled to ${outPath}`);
    logger.info(`Next: run \`memex ingest ${outPath}\` to process into wiki pages.`);
  } catch (e) {
    logger.error(`Distill failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── Mechanical distill (no LLM) ───────────────────────────────────────────────

async function mechanicalDistill(
  options: DistillOptions,
  vault: string,
  cwd: string,
  date: string
): Promise<void> {
  if (!options.input) {
    logger.error('--no-llm requires a concrete file path as input.');
    return;
  }

  const normalized = normalizePath(options.input, cwd);
  if (!(await pathExists(normalized))) {
    logger.error(`Input file not found: ${normalized}`);
    return;
  }

  const raw = await readFileUtf8(normalized);
  const lines = parseJsonlLines(raw);

  if (lines.length === 0) {
    logger.warn('No valid JSONL lines found. Treating as plain text.');
  }

  const output = mechanicalExtract(lines.length > 0 ? lines : [{ role: 'user', content: raw }]);
  const inputSlug = basename(normalized).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const outPath = options.out ?? join(vault, 'raw', 'sessions', `session-${date}-${inputSlug}.md`).replace(/\\/g, '/');

  await writeFileUtf8(outPath, output);
  logger.success(`Mechanically distilled to ${outPath}`);
}

// ── Input hint builder ────────────────────────────────────────────────────────

async function buildInputHint(
  input: string | undefined,
  vault: string,
  cwd: string,
  options: { latest?: boolean; agentId?: string; configSessionDir?: string }
): Promise<string> {
  // --latest: auto-discover from agent's session directory
  if (options.latest || (!input && options.agentId)) {
    const sessionInfo = await discoverLatestSession(options.agentId, options.configSessionDir);
    if (sessionInfo) {
      return sessionInfo;
    }
    // fallback
    return `the most recent session file in ${vault}/raw/sessions/ or current directory`;
  }

  if (!input) {
    return `the most recent session file in ${vault}/raw/sessions/ or current directory`;
  }

  try {
    const normalized = normalizePath(input, cwd);
    if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
      return normalized;
    }
  } catch {
    // ignore
  }

  return input;
}

/**
 * Discover the latest session file from the configured agent's session directory.
 * Uses fuzzy matching — returns a description for the agent to search.
 */
async function discoverLatestSession(agentId?: string, configSessionDir?: string): Promise<string | null> {
  const home = homedir();

  // Priority 1: Use configSessionDir from global config (set during onboard)
  if (configSessionDir) {
    const resolved = normalizePath(configSessionDir);
    const exists = await pathExists(resolved);
    if (exists) {
      const id = agentId as AgentId | undefined;
      const pattern = id ? (AGENT_PROFILES[id]?.sessionPattern ?? '**/*') : '**/*';
      return `Find the most recently modified session file in: ${resolved}\n` +
        `File pattern: ${pattern}\n` +
        `Sort by modification time descending and use the first (most recent) file.\n` +
        `If the directory contains project subdirectories, search recursively.`;
    }
  }

  // Priority 2: Use agent profile's default sessionDir
  if (!agentId) return null;

  const id = agentId as AgentId;
  const profile = AGENT_PROFILES[id];
  if (!profile?.sessionDir) return null;

  const sessionBase = join(home, profile.sessionDir).replace(/\\/g, '/');
  const exists = await pathExists(sessionBase);

  if (!exists) {
    // Still return the hint — the agent can try to find it
    return `Find the most recently modified session file.\n` +
      `Expected location: ${sessionBase}\n` +
      `This directory may not exist yet. Try searching in: ${home}\n` +
      `Look for ${profile.name} session/conversation files (${profile.sessionPattern ?? '*'}).`;
  }

  const pattern = profile.sessionPattern ?? '**/*';
  return `Find the most recently modified session file in: ${sessionBase}\n` +
    `File pattern: ${pattern}\n` +
    `Sort by modification time descending and use the first (most recent) file.\n` +
    `If the directory contains project subdirectories, search recursively.`;
}

// ── Agent prompt builder ──────────────────────────────────────────────────────

interface DistillPromptOptions {
  inputHint: string;
  outPath: string;
  vault: string;
  role?: string;
  agentsContent: string;
  indexContent: string;
  contextFile: string;
  date: string;
}

function buildAgentDistillPrompt(opts: DistillPromptOptions): string {
  const { inputHint, outPath, vault, role, agentsContent, indexContent, contextFile, date } = opts;

  const roleSection = role
    ? `## Target Role\n\nExtract best practices specifically for the role: **${role}**\nFocus on decisions, patterns, and lessons relevant to this role.`
    : `## Target Role\n\nExtract general best practices applicable to the whole team.`;

  return `You are a knowledge distillation agent for the LLM Wiki system.

## Your Task

Read a conversation session and distill it into a structured raw knowledge document.

## Input

${inputHint}

Use your file tools (Read, Glob) to find and read the input file.
- If it's a JSONL file, parse each line as a JSON object with \`role\` and \`content\` fields.
- If it's a plain text or markdown file, read it as-is.
- If it's a JSON array, treat each element as a message.

${roleSection}

## Wiki Context

${agentsContent ? `### AGENTS.md\n${agentsContent}` : '(no AGENTS.md found — use general wiki conventions)'}

### Current Index
${indexContent || '(empty)'}

## Output Format

Write the distilled document to: **${outPath}**

The document MUST follow this structure:

\`\`\`markdown
---
title: "Session Distillation: <brief topic>"
source-type: session
distilled: ${date}
role: ${role ?? 'general'}
tags: [tag1, tag2, tag3]
---

# Session Distillation: <brief topic>

## Summary
<2-3 sentence summary of what this session covered>

## Key Decisions
<List of concrete decisions made, with rationale>

## Best Practices Discovered
<Actionable best practices extracted from the session>

## Patterns & Anti-patterns
<Patterns to follow and anti-patterns to avoid>

## Code Examples
<Any significant code snippets from the session>

## Open Questions
<Unresolved questions or areas needing follow-up>

## References
<Links, docs, or resources mentioned>
\`\`\`

## Quality Standards

- Be concrete and actionable, not vague.
- Preserve exact code snippets with correct language tags.
- Extract implicit knowledge, not just explicit statements.
- If the session is in a non-English language, write the distillation in the same language.
- Do NOT include personal information or credentials.

After writing the file, also update ${vault}/${contextFile} if it exists, appending a brief note about this session's key learnings.

Begin now.`;
}
