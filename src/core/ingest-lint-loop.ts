/**
 * ingest-lint-loop.ts
 *
 * Self-healing pipeline: `ingest → lint → (if issues) ingest with report → lint → …`
 * Used by `memex watch` to react to raw/ changes and converge on a clean vault.
 *
 * Design:
 *   - Iteration 1 is a plain ingest on the provided target.
 *   - From iteration 2 on, the previous lint report is attached so the agent
 *     is explicitly asked to fix the remaining issues.
 *   - Loop stops when lint reports 0 issues, max iterations is reached, or the
 *     caller-supplied `stopSignal` flips true (e.g. Ctrl-C / watch --stop).
 */
import { ingestCommand } from '../commands/ingest.js';
import { runLint, type LintReport } from '../commands/lint.js';
import { contextCommand } from '../commands/context.js';
import { logger } from '../utils/logger.js';
import pc from 'picocolors';

export interface LoopReport {
  iteration: number;
  maxLabel: string;
  phase: 'ingest' | 'lint' | 'ingest-done' | 'lint-done' | 'stalled' | 'clean';
  issues?: number;
  fixing?: number;
}

export type LoopReporter = (evt: LoopReport) => void;

export interface IngestLintLoopOptions {
  vault: string;
  cwd: string;
  /** ingest target hint (path / scene / natural language). */
  target?: string;
  /** override agent id */
  agent?: string;
  /**
   * Max total ingest iterations. Defaults to 3.
   * Pass `0`, a negative number, or `Infinity` to disable the cap entirely
   * (loop until clean / signal / no-change).
   */
  maxIter?: number;
  /** Optional cooperative cancellation — checked between stages. */
  stopSignal?: () => boolean;
  /** When true, skip the initial plain ingest and just run a lint pass. */
  skipFirstIngest?: boolean;
  /**
   * When true, bypass the "same issue set twice in a row" early-exit guard.
   * Used by `memex watch --daemon --force` where the caller wants the agent
   * to keep retrying even when it looks stuck.
   */
  disableNoChangeGuard?: boolean;
  /**
   * Optional progress reporter. Invoked synchronously at every phase
   * transition so callers (e.g. `memex watch`) can update a live status
   * file / UI.
   */
  reporter?: LoopReporter;
}

export interface IngestLintLoopResult {
  iterations: number;
  stopped: 'clean' | 'max-iter' | 'signal' | 'no-change';
  finalReport: LintReport;
}

export async function runIngestLintLoop(
  opts: IngestLintLoopOptions,
): Promise<IngestLintLoopResult> {
  // 0 / negative / Infinity → treat as "no cap".
  const rawMax = opts.maxIter ?? 3;
  const max =
    !Number.isFinite(rawMax) || rawMax <= 0 ? Number.POSITIVE_INFINITY : Math.floor(rawMax);
  const maxLabel = Number.isFinite(max) ? String(max) : '∞';
  let lastReport: LintReport | undefined;
  let iteration = 0;
  let stopped: IngestLintLoopResult['stopped'] = 'max-iter';

  for (let i = 1; i <= max; i++) {
    iteration = i;
    if (opts.stopSignal?.()) {
      stopped = 'signal';
      break;
    }

    if (!(i === 1 && opts.skipFirstIngest)) {
      const fixing = lastReport?.issues.length ?? 0;
      const label = i === 1
        ? pc.cyan(`[loop] iter ${i}/${maxLabel} · ingest`)
        : pc.cyan(`[loop] iter ${i}/${maxLabel} · ingest (fixing ${fixing} issue(s))`);
      logger.info(label);
      opts.reporter?.({ iteration: i, maxLabel, phase: 'ingest', fixing });
      try {
        await ingestCommand(
          {
            target: opts.target,
            agent: opts.agent,
            vault: opts.vault,
            lintReport: lastReport,
          },
          opts.cwd,
        );
        opts.reporter?.({ iteration: i, maxLabel, phase: 'ingest-done', fixing });
      } catch (e) {
        logger.error(`[loop] ingest failed: ${e instanceof Error ? e.message : String(e)}`);
        opts.reporter?.({ iteration: i, maxLabel, phase: 'ingest-done', fixing });
        // fall through to lint so the caller still gets a report
      }
    }

    if (opts.stopSignal?.()) {
      stopped = 'signal';
      break;
    }

    logger.info(pc.cyan(`[loop] iter ${i}/${maxLabel} · lint`));
    logger.info(`[lint] vault=${opts.vault} checks=orphans,broken-links,missing-frontmatter`);
    opts.reporter?.({ iteration: i, maxLabel, phase: 'lint' });
    const report = await runLint({ vault: opts.vault }, opts.cwd);
    opts.reporter?.({ iteration: i, maxLabel, phase: 'lint-done', issues: report.issues.length });
    if (report.issues.length === 0) {
      logger.success('[loop] lint clean — knowledge base is consistent.');
      opts.reporter?.({ iteration: i, maxLabel, phase: 'clean', issues: 0 });
      await silentRefreshContexts(opts.vault, opts.cwd);
      return { iterations: i, stopped: 'clean', finalReport: report };
    }

    logger.warn(
      `[loop] lint found ${report.issues.length} issue(s): ` +
        `orphans=${report.summary.orphans}, broken=${report.summary.brokenLinks}, ` +
        `frontmatter=${report.summary.frontmatterErrors}`,
    );
    printLintIssues(report);

    // Convergence guard: if the exact same issues show up twice in a row, the
    // agent isn't making progress — bail out so we don't burn tokens forever.
    // `--force` / `disableNoChangeGuard` bypasses this: the caller has opted
    // into "loop until clean or user-stop".
    if (!opts.disableNoChangeGuard && lastReport && sameIssueSet(lastReport, report)) {
      logger.warn('[loop] no progress between iterations — stopping (pass --force to override).');
      opts.reporter?.({ iteration: i, maxLabel, phase: 'stalled', issues: report.issues.length });
      return { iterations: i, stopped: 'no-change', finalReport: report };
    }

    lastReport = report;
  }

  const finalReport =
    lastReport ?? (await runLint({ vault: opts.vault }, opts.cwd));
  if (stopped === 'signal') {
    logger.warn('[loop] stopped by signal.');
  } else {
    logger.warn(`[loop] reached max iterations (${maxLabel}) with ${finalReport.issues.length} issue(s) remaining.`);
  }
  return { iterations: iteration, stopped, finalReport };
}

/**
 * After a successful ingest→lint cycle, re-render the L0 context block for
 * every project registered via `memex context install`. This keeps the wiki
 * digest embedded in CLAUDE.md / AGENTS.md fresh without the user lifting a
 * finger. All errors are swallowed so this never breaks the main loop.
 */
async function silentRefreshContexts(vault: string, cwd: string): Promise<void> {
  try {
    await contextCommand(
      { subcommand: 'refresh', all: true, vault, quiet: true },
      cwd,
    );
  } catch {
    /* best-effort — never fail the loop because of context refresh */
  }
}

/**
 * Dump a human-readable (and log-readable) listing of every lint issue so
 * the watch log captures not only the aggregate summary but the exact
 * broken pages / links / missing frontmatter fields — otherwise tailing
 * `watch.log` forces you to re-run `memex lint` manually.
 */
function printLintIssues(report: LintReport): void {
  const max = 50;
  const shown = report.issues.slice(0, max);
  logger.info(pc.dim('── lint: issues ──'));
  for (const issue of shown) {
    if (issue.type === 'orphan') {
      logger.warn(`  orphan       ${issue.page}  (${issue.path})`);
    } else if (issue.type === 'broken-link') {
      logger.warn(`  broken-link  ${issue.source} → [[${issue.target}]]`);
    } else if (issue.type === 'missing-frontmatter') {
      logger.warn(
        `  frontmatter  ${issue.page} — missing: ${(issue.errors ?? []).join(', ')}`,
      );
    }
  }
  if (report.issues.length > max) {
    logger.info(pc.dim(`  … ${report.issues.length - max} more issue(s) elided`));
  }
  logger.info(pc.dim('── lint: issues end ──'));
}

function sameIssueSet(a: LintReport, b: LintReport): boolean {
  if (a.issues.length !== b.issues.length) return false;
  const key = (r: LintReport) =>
    r.issues
      .map((i) => `${i.type}|${i.page ?? ''}|${i.source ?? ''}|${i.target ?? ''}`)
      .sort()
      .join('\n');
  return key(a) === key(b);
}
