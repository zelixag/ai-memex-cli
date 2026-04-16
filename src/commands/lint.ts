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

export async function lintCommand(options: LintOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const wikiDir = `${vault}/wiki`;
  const index = await buildWikiIndex(wikiDir);
  const checks = options.check ? options.check.split(',') : ['orphans', 'broken-links', 'missing-frontmatter'];

  // Filter by scene if specified
  let pages = index.pages;
  if (options.scene) {
    pages = pages.filter(p => p.scene === options.scene);
  }

  const report: {
    vault: string;
    checks: string[];
    issues: Record<string, unknown>[];
    summary: { total: number; orphans: number; brokenLinks: number; frontmatterErrors: number };
  } = {
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

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    logger.info(`Vault: ${vault}`);
    logger.info(`Pages scanned: ${report.summary.total}`);
    if (report.issues.length === 0) {
      logger.success('No issues found.');
    } else {
      logger.warn(`${report.issues.length} issue(s) found:`);
      for (const issue of report.issues) {
        if (issue.type === 'orphan') {
          logger.warn(`  orphan: ${issue.page} (${issue.path})`);
        } else if (issue.type === 'broken-link') {
          logger.warn(`  broken-link: ${issue.source} → [[${issue.target}]]`);
        } else if (issue.type === 'missing-frontmatter') {
          logger.warn(`  frontmatter: ${issue.page} — ${(issue.errors as string[]).join(', ')}`);
        }
      }
    }
  }
}
