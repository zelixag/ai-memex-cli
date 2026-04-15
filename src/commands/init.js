import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { format } from 'date-fns';
import fsExtra from 'fs-extra';
import inquirer from 'inquirer';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { printBanner, printSuccess, printError, printInfo, printStep, printDivider } from '../lib/ui.js';
import { getKbStructure, saveKbConfig } from '../lib/kb.js';
import { registerKb } from '../lib/config.js';

const { ensureDirSync } = fsExtra;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KB_TYPES = {
  general: 'General purpose knowledge base',
  engineering: 'Software engineering (best practices, ADRs, patterns)',
  research: 'Research and literature review',
  team: 'Team wiki (meeting notes, decisions, processes)',
};

export async function initCommand(name, options) {
  printBanner('memex init', 'Initialize a new knowledge base');

  const targetDir = options.dir ? resolve(options.dir) : process.cwd();

  // Check if already initialized
  const existingMemex = join(targetDir, '.memex');
  if (existsSync(existingMemex)) {
    printError(`A knowledge base already exists in ${targetDir}`);
    printInfo('Use `memex kb list` to see all knowledge bases.');
    process.exit(1);
  }

  // Interactive prompts if name not provided
  let kbName = name;
  let kbType = options.type;
  let kbPurpose;

  if (!kbName || !options.type) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'kbName',
        message: 'Knowledge base name:',
        default: kbName || require('path').basename(targetDir),
        when: !kbName,
        validate: v => v.trim().length > 0 || 'Name is required',
      },
      {
        type: 'list',
        name: 'kbType',
        message: 'Knowledge base type:',
        choices: Object.entries(KB_TYPES).map(([value, name]) => ({ value, name: `${value} — ${name}` })),
        default: kbType || 'general',
        when: !options.type || options.type === 'general',
      },
      {
        type: 'input',
        name: 'kbPurpose',
        message: 'Brief description of this knowledge base:',
        default: 'A personal knowledge base',
      },
    ]);

    kbName = kbName || answers.kbName;
    kbType = kbType !== 'general' ? kbType : (answers.kbType || 'general');
    kbPurpose = answers.kbPurpose;
  } else {
    kbPurpose = `A ${kbType} knowledge base`;
  }

  const spinner = ora('Initializing knowledge base...').start();

  try {
    const structure = getKbStructure(targetDir);

    // Create directories
    ensureDirSync(structure.memexDir);
    ensureDirSync(structure.wikiDir);
    ensureDirSync(structure.sourcesDir);

    // Create subdirectories based on type
    const subDirs = getSubDirs(kbType);
    for (const subDir of subDirs) {
      ensureDirSync(join(structure.wikiDir, subDir));
    }

    // Save KB config
    const config = {
      name: kbName,
      type: kbType,
      purpose: kbPurpose,
      created: format(new Date(), 'yyyy-MM-dd'),
      version: '0.1.0',
    };
    saveKbConfig(targetDir, config);

    // Create AGENTS.md from template
    const templatePath = join(__dirname, '..', 'templates', `agents-${kbType}.md`);
    const fallbackPath = join(__dirname, '..', 'templates', 'agents-general.md');
    const templateFile = existsSync(templatePath) ? templatePath : fallbackPath;
    let agentsContent = readFileSync(templateFile, 'utf8');
    agentsContent = agentsContent
      .replace(/\{\{KB_NAME\}\}/g, kbName)
      .replace(/\{\{DATE\}\}/g, format(new Date(), 'yyyy-MM-dd'))
      .replace(/\{\{PURPOSE\}\}/g, kbPurpose);
    writeFileSync(structure.schemaFile, agentsContent);

    // Create initial index.md
    const indexContent = `# Wiki Index — ${kbName}

A catalog of all pages in this knowledge base.

| Page | Summary | Tags | Updated |
|------|---------|------|---------|

*No pages yet. Use \`memex ingest <source>\` to add knowledge.*
`;
    writeFileSync(structure.indexFile, indexContent);

    // Create initial log.md
    const logContent = `# Knowledge Base Log — ${kbName}

An append-only record of all operations.

## [${format(new Date(), 'yyyy-MM-dd HH:mm')}] init | Knowledge base initialized

- Name: ${kbName}
- Type: ${kbType}
- Purpose: ${kbPurpose}
`;
    writeFileSync(structure.logFile, logContent);

    // Create .gitignore
    const gitignoreContent = `# memex internal files
.memex/cache/
.memex/tmp/
`;
    writeFileSync(join(targetDir, '.gitignore'), gitignoreContent);

    // Register in global config
    registerKb(kbName, targetDir);

    spinner.succeed('Knowledge base initialized!');

    printDivider();
    printStep('1', `Name: ${kbName}`);
    printStep('2', `Type: ${kbType}`);
    printStep('3', `Location: ${targetDir}`);
    printDivider();

    console.log('');
    printInfo('Next steps:');
    console.log(`  memex ingest <file or URL>   — Add your first knowledge source`);
    console.log(`  memex query "<question>"     — Ask a question`);
    console.log(`  memex list                   — Browse wiki pages`);
    console.log('');

  } catch (err) {
    spinner.fail('Initialization failed');
    printError(err.message);
    process.exit(1);
  }
}

function getSubDirs(type) {
  const dirs = {
    general: ['concepts', 'entities', 'syntheses'],
    engineering: ['architecture', 'best-practices', 'patterns', 'decisions', 'runbooks'],
    research: ['papers', 'concepts', 'authors', 'syntheses'],
    team: ['decisions', 'processes', 'meetings', 'people'],
  };
  return dirs[type] || dirs.general;
}
