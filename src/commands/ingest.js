import { join, dirname, basename } from 'path';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { format } from 'date-fns';
import ora from 'ora';
import inquirer from 'inquirer';
import slugify from 'slugify';

import { printBanner, printSuccess, printError, printInfo, printStep, printMarkdown, printDivider, printWarn } from '../lib/ui.js';
import { getActiveKbPath } from '../lib/config.js';
import { getKbStructure, readIndex, readSchema, writeWikiPage, updateIndex, appendLog, searchWiki } from '../lib/kb.js';
import { fetchSource } from '../lib/fetcher.js';
import { llmCall, llmJSON, llmStream } from '../lib/llm.js';

export async function ingestCommand(source, options) {
  printBanner('memex ingest', 'Ingest a new knowledge source');

  let kbPath;
  try {
    kbPath = getActiveKbPath(options.kb);
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }

  const structure = getKbStructure(kbPath);

  // Step 1: Fetch the source
  const fetchSpinner = ora(`Fetching source: ${source.slice(0, 60)}...`).start();
  let sourceData;
  try {
    sourceData = await fetchSource(source, structure.sourcesDir);
    fetchSpinner.succeed(`Fetched: "${sourceData.title}"`);
  } catch (err) {
    fetchSpinner.fail('Failed to fetch source');
    printError(err.message);
    process.exit(1);
  }

  const { content, title } = sourceData;
  const schema = readSchema(kbPath);
  const currentIndex = readIndex(kbPath);

  // Step 2: LLM analysis — extract key information
  const analyzeSpinner = ora('Analyzing content with LLM...').start();

  let analysis;
  try {
    analysis = await llmJSON(
      buildAnalysisSystemPrompt(schema),
      buildAnalysisUserPrompt(title, content, currentIndex)
    );
    analyzeSpinner.succeed('Analysis complete');
  } catch (err) {
    analyzeSpinner.fail('LLM analysis failed');
    printError(err.message);
    process.exit(1);
  }

  // Step 3: Show analysis summary
  printDivider();
  printStep('Analysis', `"${title}"`);
  console.log('');
  console.log(`  Summary: ${analysis.summary}`);
  console.log(`  Key topics: ${(analysis.keyTopics || []).join(', ')}`);
  console.log(`  Pages to create/update: ${(analysis.pagesToWrite || []).map(p => p.name).join(', ')}`);
  if (analysis.contradictions?.length) {
    printWarn(`  Contradictions found: ${analysis.contradictions.join('; ')}`);
  }
  printDivider();

  // Step 4: Discussion (unless --no-discuss or --batch)
  let userNotes = '';
  if (options.discuss !== false && !options.batch) {
    const { proceed, notes } = await inquirer.prompt([
      {
        type: 'input',
        name: 'notes',
        message: 'Any notes or focus areas for the wiki pages? (Enter to skip):',
      },
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed to write wiki pages?',
        default: true,
      },
    ]);

    if (!proceed) {
      printInfo('Ingest cancelled.');
      return;
    }
    userNotes = notes;
  }

  // Step 5: Write wiki pages
  const writeSpinner = ora('Writing wiki pages...').start();
  const writtenPages = [];

  try {
    for (const pageSpec of (analysis.pagesToWrite || [])) {
      writeSpinner.text = `Writing: ${pageSpec.name}...`;

      const existingContent = existsSync(join(structure.wikiDir, `${pageSpec.name}.md`))
        ? readFileSync(join(structure.wikiDir, `${pageSpec.name}.md`), 'utf8')
        : null;

      const pageContent = await llmCall(
        buildPageWriterSystemPrompt(schema),
        buildPageWriterUserPrompt(pageSpec, content, title, existingContent, userNotes)
      );

      writeWikiPage(kbPath, pageSpec.name, pageContent);
      writtenPages.push(pageSpec.name);

      // Update index
      updateIndex(kbPath, pageSpec.name, pageSpec.summary, pageSpec.tags || []);
    }

    writeSpinner.succeed(`Wrote ${writtenPages.length} wiki page(s)`);
  } catch (err) {
    writeSpinner.fail('Failed to write wiki pages');
    printError(err.message);
    process.exit(1);
  }

  // Step 6: Append to log
  const sourceRef = sourceData.savedPath
    ? `sources/${basename(sourceData.savedPath)}`
    : 'inline text';

  appendLog(
    kbPath,
    'ingest',
    title,
    `- Source: ${sourceRef}\n- Pages written: ${writtenPages.map(p => `[[${p}]]`).join(', ')}\n- Summary: ${analysis.summary}`
  );

  // Done
  console.log('');
  printSuccess(`Ingested "${title}" into the knowledge base`);
  console.log('');
  printInfo('Pages written:');
  for (const page of writtenPages) {
    console.log(`  ${page}`);
  }
  console.log('');
  console.log(`  memex query "<question>"   — Query the updated knowledge base`);
  console.log(`  memex list                 — Browse all wiki pages`);
}

// --- Prompt builders ---

function buildAnalysisSystemPrompt(schema) {
  return `You are a knowledge base curator. Your job is to analyze a source document and plan wiki pages.

${schema ? `## Knowledge Base Schema\n${schema}\n` : ''}

You MUST respond with valid JSON in this exact format:
{
  "summary": "One-sentence summary of the source",
  "keyTopics": ["topic1", "topic2"],
  "pagesToWrite": [
    {
      "name": "page-slug-or-path",
      "title": "Human Readable Title",
      "summary": "One-sentence summary for the index",
      "tags": ["tag1", "tag2"],
      "action": "create | update",
      "reason": "Why this page should be created/updated"
    }
  ],
  "contradictions": ["Any contradictions with existing knowledge, or empty array"]
}

Rules for pagesToWrite:
- Use lowercase slugs with hyphens for page names (e.g., "concepts/typescript-generics")
- Create 3-8 pages per source (not too few, not too many)
- Include a summary page for the source itself
- Create/update entity and concept pages as needed
- If a relevant page already exists in the index, use "update" action`;
}

function buildAnalysisUserPrompt(title, content, currentIndex) {
  const truncatedContent = content.length > 8000 ? content.slice(0, 8000) + '\n\n[... content truncated ...]' : content;
  return `## Source Title
${title}

## Source Content
${truncatedContent}

## Current Wiki Index
${currentIndex || '(empty — this is the first source)'}

Analyze this source and plan which wiki pages to create or update.`;
}

function buildPageWriterSystemPrompt(schema) {
  return `You are a wiki page writer for a knowledge base. Write high-quality, well-structured markdown pages.

${schema ? `## Knowledge Base Schema\n${schema}\n` : ''}

Rules:
- Always start with YAML frontmatter (title, tags, summary, sources, updated)
- Use [[Page Name]] for internal wiki links
- Use ## and ### for sections
- Be concise but comprehensive
- Use > **Key Insight**: for important insights
- Use > **Best Practice**: for best practices
- Use > **Decision**: for important decisions
- Cross-reference related pages with [[links]]
- If updating an existing page, integrate new information without losing existing content`;
}

function buildPageWriterUserPrompt(pageSpec, sourceContent, sourceTitle, existingContent, userNotes) {
  const truncatedSource = sourceContent.length > 6000
    ? sourceContent.slice(0, 6000) + '\n\n[... truncated ...]'
    : sourceContent;

  return `## Page to Write
Name: ${pageSpec.name}
Title: ${pageSpec.title}
Action: ${pageSpec.action}
Reason: ${pageSpec.reason}

## Source: "${sourceTitle}"
${truncatedSource}

${existingContent ? `## Existing Page Content (to update)\n${existingContent}\n` : ''}
${userNotes ? `## User Notes\n${userNotes}\n` : ''}

Write the complete wiki page content for "${pageSpec.title}".`;
}
