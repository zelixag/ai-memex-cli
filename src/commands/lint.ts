import { resolveVaultPath } from '../core/vault.js';
import { buildWikiIndex } from '../core/wiki-index.js';
import { findOrphans, findBrokenLinks } from '../core/linker.js';
import { validateFrontmatter } from '../core/schema.js';
import { logger } from '../utils/logger.js';

export interface LintOptions {
  scene?: string;
  check?: string;
  json?: boolean;
  vault?: string;
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

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  logger.info(`Vault: ${report.vault}`);
  logger.info(`Pages scanned: ${report.summary.total}`);
  if (report.issues.length === 0) {
    logger.success('No issues found.');
    return;
  }
  logger.warn(`${report.issues.length} issue(s) found:`);
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
