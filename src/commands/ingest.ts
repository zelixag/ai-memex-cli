/**
 * ingest.ts
 *
 * `memex ingest [target]`
 *
 * Delegates to an AI agent to ingest raw content into the wiki.
 *
 * KEY DESIGN PRINCIPLE:
 *   The CLI only builds the prompt and fires the agent.
 *   The AGENT is responsible for finding files, reading them,
 *   and writing wiki pages. We do NOT validate paths here —
 *   the agent has Read/Search/Glob tools and can handle fuzzy
 *   descriptions, partial paths, or natural language targets.
 *
 * Examples:
 *   memex ingest                          → ingest all raw/ files
 *   memex ingest raw/personal             → ingest personal scene
 *   memex ingest .\global\raw\personal    → Windows relative path
 *   memex ingest "notes about React"      → natural language
 *   memex ingest ~/Downloads/article.pdf  → specific file
 *   memex ingest --agent codex            → use Codex instead of default
 *   memex ingest --dry-run                → print prompt only
 */

import { resolveGlobalVaultPath } from '../core/vault.js';
import { readFileUtf8, pathExists, normalizePath } from '../utils/fs.js';
import { runCommand } from '../utils/exec.js';
import { logger } from '../utils/logger.js';
import { readConfig } from '../core/config.js';
import { resolveAgent, buildAgentArgs, printAgentTable, AGENT_PROFILES, type AgentId } from '../core/agent-adapter.js';
import { join } from 'node:path';

export interface IngestOptions {
  /**
   * Target hint: can be a path, glob, scene name, or natural language.
   * If omitted, agent will ingest everything in vault's raw/.
   */
  target?: string;
  /** Override agent (claude-code | codex | opencode | gemini-cli | aider | generic) */
  agent?: string;
  /** Print prompt only, don't execute */
  dryRun?: boolean;
  /** Explicit vault path */
  vault?: string;
}

export async function ingestCommand(options: IngestOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);

  // ── Resolve agent ─────────────────────────────────────────────────────────
  // Priority: --agent flag > config.ingest.agent > auto-detect
  const agentIdHint = options.agent ?? config.ingest.agent;
  const agentResult = await resolveAgent(agentIdHint);

  if (!agentResult && !options.dryRun) {
    logger.error('No AI agent found. Install one of the following:');
    await printAgentTable();
    logger.info('Then set your default: memex config set agent claude-code');
    return;
  }

  const profile = agentResult?.profile ?? AGENT_PROFILES['claude-code'];
  const resolvedBin = agentResult?.resolvedBin ?? 'claude';
  const agentId = agentResult?.id ?? 'claude-code';

  // ── Read vault schema ─────────────────────────────────────────────────────
  const agentsPath = join(vault, 'AGENTS.md').replace(/\\/g, '/');
  if (!(await pathExists(agentsPath))) {
    logger.error(`No AGENTS.md found in vault: ${vault}`);
    logger.info('Run `memex init` first.');
    return;
  }
  const agentsContent = await readFileUtf8(agentsPath);
  const indexPath = join(vault, 'index.md').replace(/\\/g, '/');
  const indexContent = (await pathExists(indexPath)) ? await readFileUtf8(indexPath) : '';

  // ── Build target description ──────────────────────────────────────────────
  // We pass the raw target string as a HINT to the agent.
  // The agent uses its own file search tools to find the actual files.
  // This means: partial paths, Windows paths, natural language — all work.
  const targetHint = buildTargetHint(options.target, vault, cwd);

  // ── Build prompt ──────────────────────────────────────────────────────────
  const prompt = buildIngestPrompt({
    agentsContent,
    indexContent,
    targetHint,
    vault,
    agentId,
    contextFile: profile.contextFile,
  });

  if (options.dryRun) {
    logger.info(`Agent: ${profile.name} (${resolvedBin})`);
    logger.info(`Context file: ${profile.contextFile}`);
    logger.info(`Vault: ${vault}`);
    logger.info(`Target hint: ${targetHint}`);
    console.log('\n--- PROMPT ---\n');
    console.log(prompt);
    console.log('\n--- END PROMPT ---');
    return;
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  logger.info(`Ingesting with ${profile.name}...`);
  logger.info(`Vault: ${vault}`);
  logger.info(`Target: ${targetHint}`);

  const args = buildAgentArgs(profile, resolvedBin, prompt);

  try {
    const { stdout, stderr } = await runCommand(resolvedBin, args, { cwd: vault });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    logger.success(`Ingest complete.`);
  } catch (e) {
    logger.error(`Ingest failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── Target hint builder ───────────────────────────────────────────────────────

function buildTargetHint(target: string | undefined, vault: string, cwd: string): string {
  if (!target) {
    return `all files in ${vault}/raw/ (all scenes)`;
  }

  // Try to normalize the path — but don't fail if it doesn't exist
  // The agent will resolve it using its own tools
  try {
    const normalized = normalizePath(target, cwd);
    // If it looks like an absolute path, use it directly
    if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
      return normalized;
    }
  } catch {
    // ignore normalization errors — pass as-is
  }

  // Return as-is: could be a scene name, natural language, glob, etc.
  return target;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

interface IngestPromptOptions {
  agentsContent: string;
  indexContent: string;
  targetHint: string;
  vault: string;
  agentId: AgentId;
  contextFile: string;
}

function buildIngestPrompt(opts: IngestPromptOptions): string {
  const { agentsContent, indexContent, targetHint, vault, contextFile } = opts;
  const today = new Date().toISOString().split('T')[0];

  return `You are a knowledge base maintenance agent for the LLM Wiki system.

## Your Task

Ingest raw source documents into the wiki knowledge base.

## Target

${targetHint}

Use your file search tools (Read, Glob, Grep) to find the relevant files.
If the target is a directory path, read all .md files inside it recursively.
If the target is a file path, read that specific file.
If the target is a natural language description, search for matching files in ${vault}/raw/.

## Wiki Schema (AGENTS.md)

${agentsContent}

## Current Index

${indexContent || '(empty — this is a fresh vault)'}

## Instructions

For each raw source file you find:

1. **Read** the source document carefully.
2. **Identify** the appropriate scene (personal / research / reading / team) and page types (entity / concept / source / summary).
3. **Create or update** wiki pages at: ${vault}/wiki/<scene>/<type>/<slug>.md
   - Each page MUST have valid YAML frontmatter:
     \`\`\`yaml
     ---
     name: <human-readable name>
     description: <one-line summary>
     type: entity | concept | source | summary
     scene: personal | research | reading | team
     tags: [tag1, tag2]
     updated: ${today}
     sources: [<source-url or filename>]
     ---
     \`\`\`
   - Use [[page-name]] syntax for cross-references between wiki pages.
   - Keep pages focused: one entity/concept per file.

4. **Update** ${vault}/index.md — add a line for each new page:
   \`| [[page-name]] | type | scene | one-line description |\`

5. **Append** to ${vault}/log.md:
   \`## [${today}] ingest | <source filename>\`

6. **Do NOT** modify or delete any raw source files.

7. **Context file**: After all pages are written, update ${vault}/${contextFile} with a concise summary of the vault's current knowledge, optimized for use as AI agent context.

## Quality Standards

- Prefer updating existing pages over creating duplicates.
- Cross-reference related pages using [[wiki-links]].
- Extract concrete facts, not vague summaries.
- Code examples should be preserved in fenced code blocks.
- If a source is in a language other than English, create pages in the same language.

Begin now. Search for the target files and process them.`;
}
