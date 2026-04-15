import { join } from 'path';
import { format } from 'date-fns';
import ora from 'ora';
import inquirer from 'inquirer';
import { readFileSync } from 'fs';

import { printBanner, printSuccess, printError, printInfo, printMarkdown, printDivider, printSection } from '../lib/ui.js';
import { getActiveKbPath } from '../lib/config.js';
import { getKbStructure, readIndex, readSchema, searchWiki, writeWikiPage, updateIndex, appendLog } from '../lib/kb.js';
import { llmStream, llmCall } from '../lib/llm.js';

export async function queryCommand(question, options) {
  printBanner('memex query', question.slice(0, 60) + (question.length > 60 ? '...' : ''));

  let kbPath;
  try {
    kbPath = getActiveKbPath(options.kb);
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }

  const structure = getKbStructure(kbPath);
  const schema = readSchema(kbPath);
  const index = readIndex(kbPath);

  // Step 1: Find relevant pages
  const searchSpinner = ora('Searching wiki for relevant pages...').start();
  let relevantPages = [];
  try {
    relevantPages = await searchWiki(kbPath, question, 8);
    searchSpinner.succeed(`Found ${relevantPages.length} relevant page(s)`);
  } catch (err) {
    searchSpinner.fail('Search failed');
    printError(err.message);
    process.exit(1);
  }

  // Step 2: Read relevant page contents
  const pageContents = relevantPages.map(page => ({
    name: page.name,
    content: readFileSync(page.path, 'utf8'),
  }));

  // Step 3: Stream the answer
  printDivider();
  printSection('Answer');
  console.log('');

  let fullAnswer = '';
  try {
    fullAnswer = await llmStream(
      buildQuerySystemPrompt(schema, index),
      buildQueryUserPrompt(question, pageContents),
      (chunk) => process.stdout.write(chunk)
    );
    console.log('\n');
  } catch (err) {
    printError(`LLM query failed: ${err.message}`);
    process.exit(1);
  }

  // Step 4: Show sources
  if (relevantPages.length > 0) {
    printDivider();
    printInfo('Sources consulted:');
    for (const page of relevantPages) {
      console.log(`  [[${page.name}]]`);
    }
  }

  // Step 5: Optionally save the answer as a wiki page
  if (options.save) {
    await saveAnswerAsPage(kbPath, question, fullAnswer, relevantPages);
  } else {
    // Ask if user wants to save
    const { shouldSave } = await inquirer.prompt([{
      type: 'confirm',
      name: 'shouldSave',
      message: 'Save this answer as a wiki page?',
      default: false,
    }]);

    if (shouldSave) {
      await saveAnswerAsPage(kbPath, question, fullAnswer, relevantPages);
    }
  }

  // Log the query
  appendLog(
    kbPath,
    'query',
    question,
    `- Pages consulted: ${relevantPages.map(p => `[[${p.name}]]`).join(', ') || 'none'}`
  );
}

async function saveAnswerAsPage(kbPath, question, answer, sources) {
  const slug = slugifyQuestion(question);
  const pageName = `syntheses/${slug}`;
  const date = format(new Date(), 'yyyy-MM-dd');

  const frontmatter = `---
title: "${question}"
tags: [synthesis, query]
summary: "Answer to: ${question.slice(0, 80)}"
sources: [${sources.map(p => `"${p.name}"`).join(', ')}]
updated: "${date}"
---

`;

  const pageContent = frontmatter + `# ${question}\n\n` + answer;
  writeWikiPage(kbPath, pageName, pageContent);
  updateIndex(kbPath, pageName, question.slice(0, 80), ['synthesis']);

  printSuccess(`Saved as wiki page: ${pageName}`);
}

function buildQuerySystemPrompt(schema, index) {
  return `You are a knowledge base assistant. Answer questions using the provided wiki pages.

${schema ? `## Knowledge Base Schema\n${schema}\n` : ''}

## Wiki Index
${index}

Rules:
- Answer based on the provided wiki pages
- Cite pages using [[Page Name]] notation
- If information is missing, say so clearly
- Be concise but thorough
- Use markdown formatting for clarity
- If the question requires synthesis across multiple pages, do so explicitly`;
}

function buildQueryUserPrompt(question, pageContents) {
  const pagesText = pageContents.length > 0
    ? pageContents.map(p => `### [[${p.name}]]\n${p.content}`).join('\n\n---\n\n')
    : '(No relevant pages found in the wiki yet)';

  return `## Question
${question}

## Relevant Wiki Pages
${pagesText}

Answer the question based on the wiki pages above.`;
}

function slugifyQuestion(question) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}
