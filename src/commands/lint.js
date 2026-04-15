import { readFileSync } from 'fs';
import ora from 'ora';
import chalk from 'chalk';

import { printBanner, printSuccess, printError, printInfo, printWarn, printSection, printDivider, printTable } from '../lib/ui.js';
import { getActiveKbPath } from '../lib/config.js';
import { getKbStructure, listWikiPages, findOrphanPages, readIndex, readSchema, appendLog, writeWikiPage } from '../lib/kb.js';
import { llmJSON, llmCall } from '../lib/llm.js';

export async function lintCommand(options) {
  printBanner('memex lint', 'Health-check the knowledge base');

  let kbPath;
  try {
    kbPath = getActiveKbPath(options.kb);
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }

  const issues = [];

  // Check 1: Orphan pages
  const orphanSpinner = ora('Checking for orphan pages...').start();
  try {
    const orphans = await findOrphanPages(kbPath);
    if (orphans.length > 0) {
      orphanSpinner.warn(`Found ${orphans.length} orphan page(s)`);
      for (const page of orphans) {
        issues.push({ type: 'orphan', severity: 'warn', page: page.name, message: 'No inbound links from other pages' });
      }
    } else {
      orphanSpinner.succeed('No orphan pages found');
    }
  } catch (err) {
    orphanSpinner.fail(`Orphan check failed: ${err.message}`);
  }

  // Check 2: Pages without proper frontmatter
  const fmSpinner = ora('Checking frontmatter...').start();
  try {
    const pages = await listWikiPages(kbPath);
    const missingFm = pages.filter(p => !p.title || !p.summary);
    if (missingFm.length > 0) {
      fmSpinner.warn(`${missingFm.length} page(s) missing frontmatter`);
      for (const page of missingFm) {
        issues.push({ type: 'frontmatter', severity: 'warn', page: page.name, message: 'Missing title or summary in frontmatter' });
      }
    } else {
      fmSpinner.succeed('All pages have proper frontmatter');
    }
  } catch (err) {
    fmSpinner.fail(`Frontmatter check failed: ${err.message}`);
  }

  // Check 3: LLM-powered deep analysis
  const llmSpinner = ora('Running LLM analysis (contradictions, stale claims, gaps)...').start();
  try {
    const pages = await listWikiPages(kbPath);
    const schema = readSchema(kbPath);
    const index = readIndex(kbPath);

    if (pages.length === 0) {
      llmSpinner.info('No pages to analyze yet');
    } else {
      // Sample up to 20 pages for LLM analysis
      const samplePages = pages.slice(0, 20);
      const pagesContent = samplePages.map(p => ({
        name: p.name,
        summary: p.summary,
        tags: p.tags,
        updated: p.updated,
      }));

      const llmIssues = await llmJSON(
        buildLintSystemPrompt(schema),
        buildLintUserPrompt(index, pagesContent)
      );

      if (llmIssues.issues && llmIssues.issues.length > 0) {
        llmSpinner.warn(`LLM found ${llmIssues.issues.length} issue(s)`);
        for (const issue of llmIssues.issues) {
          issues.push({
            type: issue.type,
            severity: issue.severity || 'info',
            page: issue.page || 'wiki',
            message: issue.message,
            suggestion: issue.suggestion,
          });
        }
      } else {
        llmSpinner.succeed('LLM analysis: no major issues found');
      }

      // Show suggested topics
      if (llmIssues.suggestedTopics?.length) {
        console.log('');
        printInfo('Suggested topics to investigate:');
        for (const topic of llmIssues.suggestedTopics) {
          console.log(`  ${chalk.cyan('?')} ${topic}`);
        }
      }
    }
  } catch (err) {
    llmSpinner.fail(`LLM analysis failed: ${err.message}`);
  }

  // Display results
  printDivider();
  if (issues.length === 0) {
    printSuccess('Knowledge base is healthy! No issues found.');
  } else {
    printSection(`Found ${issues.length} issue(s)`);
    console.log('');

    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warn');
    const infos = issues.filter(i => i.severity === 'info');

    if (errors.length) {
      console.log(chalk.red.bold(`  ${errors.length} error(s):`));
      for (const i of errors) {
        console.log(`    ${chalk.red('✗')} [${i.type}] ${i.page}: ${i.message}`);
        if (i.suggestion) console.log(`      ${chalk.gray('→')} ${i.suggestion}`);
      }
    }

    if (warnings.length) {
      console.log(chalk.yellow.bold(`  ${warnings.length} warning(s):`));
      for (const i of warnings) {
        console.log(`    ${chalk.yellow('!')} [${i.type}] ${i.page}: ${i.message}`);
        if (i.suggestion) console.log(`      ${chalk.gray('→')} ${i.suggestion}`);
      }
    }

    if (infos.length) {
      console.log(chalk.blue.bold(`  ${infos.length} suggestion(s):`));
      for (const i of infos) {
        console.log(`    ${chalk.blue('i')} [${i.type}] ${i.page}: ${i.message}`);
        if (i.suggestion) console.log(`      ${chalk.gray('→')} ${i.suggestion}`);
      }
    }
  }

  // Log lint pass
  appendLog(
    kbPath,
    'lint',
    `Health check — ${issues.length} issue(s) found`,
    `- Errors: ${issues.filter(i => i.severity === 'error').length}\n- Warnings: ${issues.filter(i => i.severity === 'warn').length}\n- Suggestions: ${issues.filter(i => i.severity === 'info').length}`
  );
}

function buildLintSystemPrompt(schema) {
  return `You are a knowledge base health checker. Analyze the wiki and find issues.

${schema ? `## Knowledge Base Schema\n${schema}\n` : ''}

You MUST respond with valid JSON:
{
  "issues": [
    {
      "type": "contradiction | stale | missing-page | missing-link | inconsistency",
      "severity": "error | warn | info",
      "page": "page-name or 'wiki'",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "suggestedTopics": ["topic1", "topic2"]
}

Look for:
1. Contradictions between pages (same topic, conflicting claims)
2. Pages that seem stale (old dates, likely outdated content)
3. Important concepts mentioned in summaries but lacking their own page
4. Missing cross-references between clearly related pages
5. Gaps in coverage that could be filled`;
}

function buildLintUserPrompt(index, pages) {
  return `## Wiki Index
${index}

## Page Summaries
${pages.map(p => `- [[${p.name}]]: ${p.summary} (tags: ${p.tags?.join(', ')}, updated: ${p.updated})`).join('\n')}

Analyze this knowledge base and report issues.`;
}
