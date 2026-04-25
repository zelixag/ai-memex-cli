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
 *   memex ingest .\raw\personal           → Windows path under vault raw/
 *   memex ingest "notes about React"      → natural language
 *   memex ingest ~/Downloads/article.pdf  → specific file
 *   memex ingest --agent codex            → use Codex instead of default
 *   memex ingest --dry-run                → print prompt only
 */

import { resolveGlobalVaultPath, resolveVaultSchemaPathForRead } from '../core/vault.js';
import { readFileUtf8, pathExists, normalizePath } from '../utils/fs.js';
import { runCommandStreamed } from '../utils/exec.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/progress.js';
import pc from 'picocolors';
import { readConfig } from '../core/config.js';
import {
  resolveAgent,
  prepareAgentPromptArgs,
  printAgentTable,
  AGENT_PROFILES,
  VAULT_SCHEMA_MARKDOWN_FILENAMES,
  type AgentId,
} from '../core/agent-adapter.js';
import type { LintReport } from './lint.js';
import { basename, join } from 'node:path';

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
  /**
   * Optional lint report to attach to the prompt. When provided the agent is
   * asked to fix these issues in addition to normal ingest work — used by
   * `memex watch` to drive the ingest→lint→ingest self-healing loop.
   */
  lintReport?: LintReport;
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
  const schemaPath = await resolveVaultSchemaPathForRead(vault, config.agent ?? agentId);
  if (!schemaPath) {
    logger.error(
      `No wiki schema file in vault: ${vault} (expected one of: ${VAULT_SCHEMA_MARKDOWN_FILENAMES.join(', ')})`,
    );
    logger.info('Run `memex init` or `memex onboard` first.');
    return;
  }
  const agentsContent = await readFileUtf8(schemaPath);
  const vaultDigestFile = basename(schemaPath);
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
    contextFile: vaultDigestFile,
    lintReport: options.lintReport,
  });

  if (options.dryRun) {
    logger.info(`Agent: ${profile.name} (${resolvedBin})`);
    logger.info(`Vault schema file: ${vaultDigestFile}`);
    logger.info(`Vault: ${vault}`);
    logger.info(`Target hint: ${targetHint}`);
    console.log('\n--- PROMPT ---\n');
    console.log(prompt);
    console.log('\n--- END PROMPT ---');
    return;
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  logger.info(`Vault: ${vault}`);
  logger.info(`Target: ${targetHint}`);

  const prepared = prepareAgentPromptArgs(profile, resolvedBin, prompt, { taskSlug: 'ingest' });
  if (prepared.usedPromptFile) {
    logger.info('[ingest] prompt delivery: temp file (Windows argv limit / long prompt)');
  }
  logger.info(`[ingest] agent  : ${profile.name} (${agentId})`);
  logger.info(`[ingest] binary : ${resolvedBin}`);
  logger.info(`[ingest] cwd    : ${vault}`);
  logger.info(
    `[ingest] command: ${formatCommandLine(resolvedBin, prepared.args, prompt.length, prepared.argvPromptValue)}`,
  );
  logger.info(`[ingest] prompt : ${prompt.length} chars (${prompt.split(/\r?\n/).length} lines)`);
  printPromptDigest(prompt);

  // TTY users still see the spinner; in daemon mode stdout is piped to the
  // log file so the spinner's carriage-return repaint becomes a stream of
  // harmless lines — still informative, not broken.
  const spinner = createSpinner(`正在调用 ${profile.name} 处理 ingest…`);

  console.log(pc.dim('── ingest: agent output ──'));
  try {
    const { stdout, stderr, code } = await runCommandStreamed(resolvedBin, prepared.args, {
      cwd: vault,
      onStdout: (chunk) => process.stdout.write(chunk),
    });
    console.log(pc.dim(`── ingest: agent done (exit ${code}, stdout=${stdout.length}B, stderr=${stderr.length}B) ──`));
    spinner.stop('Ingest complete.', 'ok');
  } catch (e) {
    const err = e as Error & { code?: number | null };
    console.log(pc.dim(`── ingest: agent FAILED (exit ${err.code ?? '?'}) ──`));
    spinner.stop(`Ingest failed: ${err.message}`, 'err');
  } finally {
    prepared.cleanup();
  }
}

// ── Verbose logging helpers ──────────────────────────────────────────────────

/**
 * Render the exact command line for the log, but replace the (potentially
 * enormous) prompt argument with a placeholder so the log stays readable.
 */
function formatCommandLine(bin: string, args: string[], promptChars: number, argvPrompt: string): string {
  const placeholder =
    argvPrompt.length < promptChars
      ? `<prompt:${promptChars}chars,via-temp-file>`
      : `<prompt:${promptChars}chars>`;
  const masked = args.map((a) => (a === argvPrompt ? placeholder : quoteArgForLog(a)));
  return [quoteArgForLog(bin), ...masked].join(' ');
}

function quoteArgForLog(arg: string): string {
  if (arg === '') return '""';
  if (/[\s"'`$\\]/.test(arg)) {
    return '"' + arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return arg;
}

/**
 * Print a truncated, indented preview of the prompt so future readers of
 * the log can see what the agent was actually asked to do without the log
 * ballooning by tens of KB per run.
 */
function printPromptDigest(prompt: string, maxLines = 40): void {
  const lines = prompt.split(/\r?\n/);
  const head = lines.slice(0, maxLines);
  console.log(pc.dim('── ingest: prompt (head) ──'));
  for (const line of head) console.log('  ' + line);
  if (lines.length > maxLines) {
    console.log(pc.dim(`  … ${lines.length - maxLines} more line(s) elided`));
  }
  console.log(pc.dim('── ingest: prompt end ──'));
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
  lintReport?: LintReport;
}

function buildIngestPrompt(opts: IngestPromptOptions): string {
  const { agentsContent, indexContent, targetHint, vault, contextFile, lintReport } = opts;

  const fixSection = formatLintReportForPrompt(lintReport);

  return `You are a knowledge base maintenance agent for the LLM Wiki system.${fixSection}

## Your Task

Ingest raw source documents into the wiki knowledge base.

## Target

${targetHint}

Use your file search tools (Read, Glob, Grep) to find the relevant files.
If the target is a directory path, read all source files inside it recursively, including: source code (.ts, .tsx, .js, .jsx, .vue, .py, .go, .rs, etc.), documents (.md, .mdx, .txt, .rst), configs (.json, .yaml, .yml, .toml, .xml, .env), and any other text-based files.
If the target is a file path, read that specific file.
If the target is a natural language description, search for matching files in ${vault}/raw/.

### Session files

Agent conversation transcripts distilled by \`memex distill\` live under
\`${vault}/raw/<scene>/sessions/\` (default scene: \`team\`). They are already
structured Markdown with a YAML frontmatter containing \`source-type: session\`,
\`started\`, \`ended\`, \`turns\` and \`sources\`, plus per-turn \`## 👤 User\` /
\`## 🤖 Assistant\` sections.

Treat each \`.md\` session file as **one source document** and:

- Extract key decisions, final answers, discovered best practices, reusable code snippets, and open questions.
- Preserve the session's language (don't translate).
- When writing wiki pages, cite the session file under \`sources:\` and keep \`source-type: session\` where applicable.
- If you encounter legacy raw \`.jsonl\` files (older vaults), parse them line-by-line — each line is a JSON message with \`role\` / \`content\`; skip \`tool_use\` / \`tool_result\` blocks and \`role: "system"\`.
- Never mutate or delete session source files.

## Wiki Schema

${agentsContent}

## Current Index

${indexContent || '(empty — this is a fresh vault)'}

## Instructions

1. Read all source files in the target.
2. Create or update wiki pages following the schema above.
3. Never modify or delete raw source files.
4. After writing pages, update ${vault}/index.md and ${vault}/log.md as instructed in the schema.

Begin now.`;
}

/**
 * Format a lint report into a high-priority fix-up section that is prepended
 * to the ingest prompt. When the report is empty or missing we contribute
 * nothing so the prompt stays identical to the plain ingest case.
 */
function formatLintReportForPrompt(report?: LintReport): string {
  if (!report || report.issues.length === 0) return '';

  const lines: string[] = [];
  lines.push('\n\n## ⚠ Lint Feedback — FIX THESE FIRST\n');
  lines.push(
    `The previous ingest left the wiki with ${report.issues.length} lint issue(s). ` +
      'Before touching any new raw sources, repair the items below. For each one, ' +
      'update or create the relevant wiki page so that a subsequent `memex lint` run ' +
      'reports zero issues.\n',
  );
  lines.push(
    `Totals — orphans: ${report.summary.orphans}, broken-links: ${report.summary.brokenLinks}, ` +
      `frontmatter errors: ${report.summary.frontmatterErrors}\n`,
  );
  lines.push('Issues:');
  for (const issue of report.issues.slice(0, 200)) {
    if (issue.type === 'orphan') {
      lines.push(`- orphan: \`${issue.page}\` (${issue.path}) — link it from index.md or another page, or delete if obsolete.`);
    } else if (issue.type === 'broken-link') {
      lines.push(`- broken-link: \`${issue.source}\` → \`[[${issue.target}]]\` — either create the missing page or fix the link target.`);
    } else if (issue.type === 'missing-frontmatter') {
      lines.push(`- frontmatter: \`${issue.page}\` — missing/invalid fields: ${(issue.errors ?? []).join(', ')}`);
    }
  }
  if (report.issues.length > 200) {
    lines.push(`- …and ${report.issues.length - 200} more (truncated).`);
  }
  lines.push('');
  lines.push('Do NOT mutate raw/ sources to silence lint — always fix the wiki side.');
  return lines.join('\n');
}
