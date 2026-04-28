import { resolveVaultPath, resolveGlobalVaultPath, resolveVaultSchemaPathForRead } from '../core/vault.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import { findOrphans, findBrokenLinks } from '../core/linker.js';
import { validateFrontmatter } from '../core/schema.js';
import { readFileUtf8, pathExists } from '../utils/fs.js';
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
} from '../core/agent-adapter.js';
import { join, basename } from 'node:path';

export interface LintOptions {
  scene?: string;
  check?: string;
  json?: boolean;
  vault?: string;
  /**
   * Run the semantic-lint pass after the mechanical pass. The CLI spawns a
   * sub-agent (cwd = vault) with the live `AGENTS.md` schema and the
   * mechanical lint report inlined into the prompt. The sub-agent fixes
   * what it can and files unresolved findings as a wiki page.
   */
  withSemantic?: boolean;
  /** Override agent for the semantic pass */
  agent?: string;
  /** Print the semantic prompt only, don't execute */
  dryRun?: boolean;
}

export interface LintIssue {
  type: 'orphan' | 'broken-link' | 'missing-frontmatter';
  page?: string;
  path?: string;
  source?: string;
  target?: string;
  errors?: string[];
}

export interface LintReport {
  vault: string;
  checks: string[];
  issues: LintIssue[];
  summary: {
    total: number;
    orphans: number;
    brokenLinks: number;
    frontmatterErrors: number;
  };
}

/**
 * Programmatic lint: pure function that returns a structured report without
 * touching the terminal. Used by `memex watch` to drive the ingest→lint loop.
 */
export async function runLint(options: Omit<LintOptions, 'json'>, cwd: string): Promise<LintReport> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const wikiDir = `${vault}/wiki`;
  const index = await buildWikiIndex(wikiDir);
  const checks = options.check
    ? options.check.split(',')
    : ['orphans', 'broken-links', 'missing-frontmatter'];

  let pages = index.pages;
  if (options.scene) {
    pages = pages.filter((p) => p.scene === options.scene);
  }

  const report: LintReport = {
    vault,
    checks: [],
    issues: [],
    summary: { total: pages.length, orphans: 0, brokenLinks: 0, frontmatterErrors: 0 },
  };

  if (checks.includes('orphans')) {
    report.checks.push('orphans');
    const orphans = findOrphans(pages);
    report.summary.orphans = orphans.length;
    for (const p of orphans) {
      report.issues.push({ type: 'orphan', page: p.id, path: p.path });
    }
  }

  if (checks.includes('broken-links')) {
    report.checks.push('broken-links');
    const broken = findBrokenLinks(pages);
    report.summary.brokenLinks = broken.length;
    for (const b of broken) {
      report.issues.push({ type: 'broken-link', source: b.source, target: b.target });
    }
  }

  if (checks.includes('missing-frontmatter')) {
    report.checks.push('missing-frontmatter');
    for (const p of pages) {
      const errors = validateFrontmatter(p.frontmatter);
      if (errors.length) {
        report.summary.frontmatterErrors++;
        report.issues.push({ type: 'missing-frontmatter', page: p.id, errors });
      }
    }
  }

  return report;
}

export async function lintCommand(options: LintOptions, cwd: string): Promise<void> {
  const report = await runLint(options, cwd);

  if (options.json && !options.withSemantic) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // ── Mechanical pass output ────────────────────────────────────────────────
  logger.info(`Vault: ${report.vault}`);
  logger.info(`Pages scanned: ${report.summary.total}`);
  if (report.issues.length === 0) {
    logger.success('Mechanical pass: no issues.');
  } else {
    logger.warn(`Mechanical pass: ${report.issues.length} issue(s) found:`);
    for (const issue of report.issues) {
      if (issue.type === 'orphan') {
        logger.warn(`  orphan: ${issue.page} (${issue.path})`);
      } else if (issue.type === 'broken-link') {
        logger.warn(`  broken-link: ${issue.source} → [[${issue.target}]]`);
      } else if (issue.type === 'missing-frontmatter') {
        logger.warn(`  frontmatter: ${issue.page} — ${(issue.errors ?? []).join(', ')}`);
      }
    }
  }

  if (!options.withSemantic) return;

  // ── Semantic pass (sub-agent) ─────────────────────────────────────────────
  await runSemanticLintPass(options, cwd, report);
}

/**
 * Spawn a sub-agent with `cwd = vault` and the live `AGENTS.md` schema +
 * mechanical lint report inlined into the prompt. The sub-agent does the
 * 7-category semantic scan, fixes what it can, and files unresolved
 * findings as a wiki page (e.g. `overviews/lint-report-YYYY-MM-DD.md`).
 *
 * Mirrors the ingest spawn pattern: CLI is the toolbox, semantic judgment
 * stays inside the agent.
 */
async function runSemanticLintPass(
  options: LintOptions,
  cwd: string,
  mechanicalReport: LintReport,
): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);

  const agentIdHint = options.agent ?? config.ingest.agent;
  const agentResult = await resolveAgent(agentIdHint);

  if (!agentResult && !options.dryRun) {
    logger.error('Semantic lint requires an AI agent. Install one of the following:');
    await printAgentTable();
    logger.info('Then set your default: memex config set agent claude-code');
    return;
  }

  const profile = agentResult?.profile ?? AGENT_PROFILES['claude-code'];
  const resolvedBin = agentResult?.resolvedBin ?? 'claude';
  const agentId = agentResult?.id ?? 'claude-code';

  const schemaPath = await resolveVaultSchemaPathForRead(vault, config.agent ?? agentId);
  if (!schemaPath) {
    logger.error(
      `No wiki schema file in vault: ${vault} (expected one of: ${VAULT_SCHEMA_MARKDOWN_FILENAMES.join(', ')})`,
    );
    logger.info('Run `memex init` or `memex onboard` first.');
    return;
  }
  const agentsContent = await readFileUtf8(schemaPath);
  const schemaFile = basename(schemaPath);
  const indexPath = join(vault, 'index.md').replace(/\\/g, '/');
  const indexContent = (await pathExists(indexPath)) ? await readFileUtf8(indexPath) : '';

  const prompt = buildSemanticLintPrompt({
    agentsContent,
    indexContent,
    mechanicalReport,
    vault,
    schemaFile,
  });

  if (options.dryRun) {
    logger.info(`Agent: ${profile.name} (${resolvedBin})`);
    logger.info(`Vault schema file: ${schemaFile}`);
    logger.info(`Vault: ${vault}`);
    console.log('\n--- PROMPT ---\n');
    console.log(prompt);
    console.log('\n--- END PROMPT ---');
    return;
  }

  logger.info(`Vault: ${vault}`);
  logger.info(`[lint:semantic] agent  : ${profile.name} (${agentId})`);
  logger.info(`[lint:semantic] binary : ${resolvedBin}`);
  logger.info(`[lint:semantic] cwd    : ${vault}`);

  const prepared = prepareAgentPromptArgs(profile, resolvedBin, prompt, { taskSlug: 'lint-semantic' });
  if (prepared.usedPromptFile) {
    logger.info('[lint:semantic] prompt delivery: temp file (Windows argv limit / long prompt)');
  }
  logger.info(`[lint:semantic] prompt : ${prompt.length} chars (${prompt.split(/\r?\n/).length} lines)`);

  const spinner = createSpinner(`正在调用 ${profile.name} 进行 semantic lint…`);
  console.log(pc.dim('── lint:semantic: agent output ──'));
  try {
    const { stdout, stderr, code } = await runCommandStreamed(resolvedBin, prepared.args, {
      cwd: vault,
      onStdout: (chunk) => process.stdout.write(chunk),
    });
    console.log(pc.dim(`── lint:semantic: agent done (exit ${code}, stdout=${stdout.length}B, stderr=${stderr.length}B) ──`));
    spinner.stop('Semantic lint complete.', 'ok');
  } catch (e) {
    const err = e as Error & { code?: number | null };
    console.log(pc.dim(`── lint:semantic: agent FAILED (exit ${err.code ?? '?'}) ──`));
    spinner.stop(`Semantic lint failed: ${err.message}`, 'err');
  } finally {
    prepared.cleanup();
  }
}

interface SemanticLintPromptOptions {
  agentsContent: string;
  indexContent: string;
  mechanicalReport: LintReport;
  vault: string;
  schemaFile: string;
}

function buildSemanticLintPrompt(opts: SemanticLintPromptOptions): string {
  const { agentsContent, indexContent, mechanicalReport, vault, schemaFile } = opts;
  return `You are a wiki health-check agent for the LLM Wiki system.

## Your Task

Run the semantic lint pass against the vault. The mechanical pass has already run; its JSON report is below. Your job is to scan the wiki for the categories the mechanical pass cannot detect, then either fix issues directly or file unresolved findings as a wiki page.

## Vault

${vault}

## Mechanical Lint Report (already run)

\`\`\`json
${JSON.stringify(mechanicalReport, null, 2)}
\`\`\`

## Wiki Schema (live, from ${schemaFile})

${agentsContent}

## Current Index

${indexContent || '(empty — this is a fresh vault)'}

## Instructions

1. Read the schema's "Lint" / "Semantic lint" section to find the authoritative list of semantic categories to check (typically: contradictions, stale claims, missing cross-references, concepts mentioned without their own page, data gaps, suggested next sources, cross-scene duplicates).
2. Use Read / Glob / Grep to scan ${vault}/wiki/ for findings in each category.
3. Apply safe, unambiguous fixes directly (broken-link suggestions, frontmatter corrections, obvious cross-reference additions, page-merge stubs when the duplicate is unambiguous).
4. For ambiguous or large-scope findings (e.g. genuine contradictions, suggested page splits), file a wiki page at ${vault}/wiki/<scene>/overviews/lint-report-YYYY-MM-DD.md with \`type: overview\` summarizing what was found and what needs human / agent review.
5. Update ${vault}/index.md if you created the lint report page.
6. Append to ${vault}/log.md: \`## [YYYY-MM-DD] lint:semantic | <one-line summary>\`.
7. Never mutate \`raw/\` files.

Begin now.`;
}
