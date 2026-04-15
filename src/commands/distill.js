import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';
import ora from 'ora';
import inquirer from 'inquirer';
import fetch from 'node-fetch';

import { printBanner, printSuccess, printError, printInfo, printMarkdown, printDivider, printSection } from '../lib/ui.js';
import { getActiveKbPath } from '../lib/config.js';
import { getKbStructure, readSchema, writeWikiPage, updateIndex, appendLog } from '../lib/kb.js';
import { llmJSON, llmCall } from '../lib/llm.js';

const ROLE_DESCRIPTIONS = {
  'backend-engineer': 'Backend software engineer working with APIs, databases, and services',
  'frontend-engineer': 'Frontend engineer working with UI components, state management, and UX',
  'tech-lead': 'Technical lead responsible for architecture decisions and team conventions',
  'devops': 'DevOps/SRE engineer working with deployment, monitoring, and infrastructure',
  'product-manager': 'Product manager working with requirements, roadmaps, and stakeholders',
  'data-engineer': 'Data engineer working with pipelines, warehouses, and analytics',
  'general': 'General software professional',
};

export async function distillCommand(source, options) {
  printBanner('memex distill', 'Distill best practices from conversations');

  let kbPath;
  try {
    kbPath = getActiveKbPath(options.kb);
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }

  const structure = getKbStructure(kbPath);
  const schema = readSchema(kbPath);

  // Load source content
  let content;
  let sourceTitle;

  if (existsSync(source)) {
    content = readFileSync(source, 'utf8');
    sourceTitle = source.split('/').pop().replace(/\.[^.]+$/, '');
  } else if (source.startsWith('http://') || source.startsWith('https://')) {
    const fetchSpinner = ora('Fetching conversation...').start();
    try {
      const resp = await fetch(source);
      content = await resp.text();
      sourceTitle = 'Web conversation';
      fetchSpinner.succeed('Fetched');
    } catch (err) {
      fetchSpinner.fail('Failed to fetch');
      printError(err.message);
      process.exit(1);
    }
  } else {
    // Treat as raw text
    content = source;
    sourceTitle = 'Inline conversation';
  }

  // Determine role
  let role = options.role;
  if (!role) {
    const { selectedRole } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedRole',
      message: 'Distill best practices for which role?',
      choices: Object.entries(ROLE_DESCRIPTIONS).map(([value, name]) => ({ value, name: `${value} — ${name}` })),
      default: 'general',
    }]);
    role = selectedRole;
  }

  const roleDesc = ROLE_DESCRIPTIONS[role] || role;

  // LLM distillation
  const distillSpinner = ora(`Distilling best practices for: ${role}...`).start();
  let distillation;
  try {
    distillation = await llmJSON(
      buildDistillSystemPrompt(schema, role, roleDesc),
      buildDistillUserPrompt(content, sourceTitle, role)
    );
    distillSpinner.succeed('Distillation complete');
  } catch (err) {
    distillSpinner.fail('Distillation failed');
    printError(err.message);
    process.exit(1);
  }

  // Show summary
  printDivider();
  printSection(`Distilled: ${distillation.title || sourceTitle}`);
  console.log(`  Role: ${role}`);
  console.log(`  Best practices found: ${(distillation.bestPractices || []).length}`);
  console.log(`  Decisions found: ${(distillation.decisions || []).length}`);
  console.log(`  Pages to write: ${(distillation.pages || []).length}`);
  printDivider();

  // Write wiki pages
  const writeSpinner = ora('Writing best practice pages...').start();
  const writtenPages = [];

  try {
    for (const page of (distillation.pages || [])) {
      writeSpinner.text = `Writing: ${page.name}...`;

      const pageContent = await llmCall(
        buildPageWriterSystemPrompt(schema, role),
        buildPageWriterUserPrompt(page, distillation, sourceTitle)
      );

      writeWikiPage(kbPath, page.name, pageContent);
      writtenPages.push(page.name);
      updateIndex(kbPath, page.name, page.summary, page.tags || [role, 'best-practice']);
    }

    writeSpinner.succeed(`Wrote ${writtenPages.length} page(s)`);
  } catch (err) {
    writeSpinner.fail('Failed to write pages');
    printError(err.message);
    process.exit(1);
  }

  // Log
  appendLog(
    kbPath,
    'distill',
    `${sourceTitle} → ${role} best practices`,
    `- Role: ${role}\n- Pages: ${writtenPages.map(p => `[[${p}]]`).join(', ')}`
  );

  console.log('');
  printSuccess(`Distilled ${writtenPages.length} best practice page(s) for: ${role}`);
  for (const page of writtenPages) {
    console.log(`  ${page}`);
  }
  console.log('');
  printInfo(`Use \`memex context --role ${role}\` to generate context for this role`);
}

function buildDistillSystemPrompt(schema, role, roleDesc) {
  return `You are a knowledge distiller specializing in extracting best practices from conversations and sessions.

Role focus: ${role} — ${roleDesc}

${schema ? `## Knowledge Base Schema\n${schema}\n` : ''}

You MUST respond with valid JSON:
{
  "title": "Brief title for this distillation",
  "summary": "One-paragraph summary of key insights",
  "bestPractices": [
    { "practice": "...", "context": "...", "rationale": "..." }
  ],
  "decisions": [
    { "decision": "...", "rationale": "...", "tradeoffs": "..." }
  ],
  "antiPatterns": [
    { "pattern": "...", "problem": "...", "alternative": "..." }
  ],
  "pages": [
    {
      "name": "best-practices/role-topic-slug",
      "title": "Human Readable Title",
      "summary": "One-sentence summary",
      "tags": ["${role}", "best-practice", "topic"]
    }
  ]
}

Focus on:
- Concrete, actionable best practices (not vague advice)
- Specific decisions with clear rationale
- Anti-patterns to avoid
- Lessons learned from the conversation`;
}

function buildDistillUserPrompt(content, sourceTitle, role) {
  const truncated = content.length > 10000 ? content.slice(0, 10000) + '\n[... truncated ...]' : content;
  return `## Source: ${sourceTitle}

${truncated}

Extract best practices for a ${role} from this conversation/session.`;
}

function buildPageWriterSystemPrompt(schema, role) {
  return `You are writing a best practices wiki page for a ${role}.

${schema ? `## Knowledge Base Schema\n${schema}\n` : ''}

Write a comprehensive, well-structured markdown page with:
- YAML frontmatter (title, tags, summary, updated)
- Clear sections with ## headers
- Concrete examples where possible
- > **Best Practice**: blockquotes for key practices
- > **Anti-Pattern**: blockquotes for things to avoid
- > **Decision**: blockquotes for important decisions
- [[links]] to related pages`;
}

function buildPageWriterUserPrompt(page, distillation, sourceTitle) {
  return `## Page to Write
Name: ${page.name}
Title: ${page.title}
Summary: ${page.summary}

## Distilled Knowledge
Best Practices:
${(distillation.bestPractices || []).map(bp => `- ${bp.practice}: ${bp.rationale}`).join('\n')}

Decisions:
${(distillation.decisions || []).map(d => `- ${d.decision}: ${d.rationale}`).join('\n')}

Anti-Patterns:
${(distillation.antiPatterns || []).map(ap => `- ${ap.pattern}: ${ap.problem} → ${ap.alternative}`).join('\n')}

Source: ${sourceTitle}

Write the complete wiki page for "${page.title}".`;
}
