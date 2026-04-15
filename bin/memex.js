#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

// Import commands
import { initCommand } from '../src/commands/init.js';
import { ingestCommand } from '../src/commands/ingest.js';
import { queryCommand } from '../src/commands/query.js';
import { lintCommand } from '../src/commands/lint.js';
import { contextCommand } from '../src/commands/context.js';
import { listCommand } from '../src/commands/list.js';
import { kbCommand } from '../src/commands/kb.js';
import { configCommand } from '../src/commands/config.js';
import { distillCommand } from '../src/commands/distill.js';
import { syncCommand } from '../src/commands/sync.js';

program
  .name('memex')
  .description(
    'A CLI tool for building LLM-powered persistent knowledge bases.\n' +
    'Give AI agents like Claude Code a compounding, persistent memory.'
  )
  .version(pkg.version);

// memex init — initialize a new knowledge base
program
  .command('init [name]')
  .description('Initialize a new knowledge base in the current directory')
  .option('-t, --type <type>', 'knowledge base type: general | engineering | research | team', 'general')
  .option('-d, --dir <dir>', 'target directory (default: current dir)')
  .action(initCommand);

// memex ingest — ingest a new source into the knowledge base
program
  .command('ingest <source>')
  .description('Ingest a file, URL, or text into the knowledge base')
  .option('-k, --kb <name>', 'target knowledge base name')
  .option('-b, --batch', 'batch mode: less interactive, faster processing')
  .option('--no-discuss', 'skip discussion, directly write wiki pages')
  .action(ingestCommand);

// memex query — query the knowledge base
program
  .command('query <question>')
  .description('Ask a question against the knowledge base')
  .option('-k, --kb <name>', 'target knowledge base name')
  .option('-f, --format <format>', 'output format: text | markdown | table', 'markdown')
  .option('--save', 'save the answer as a new wiki page')
  .action(queryCommand);

// memex lint — health check the knowledge base
program
  .command('lint')
  .description('Health-check the wiki: find contradictions, orphan pages, stale claims')
  .option('-k, --kb <name>', 'target knowledge base name')
  .option('--fix', 'attempt to auto-fix issues found')
  .action(lintCommand);

// memex context — generate distilled context for AI agents
program
  .command('context')
  .description('Generate a distilled context snapshot for AI agents (Claude Code, etc.)')
  .option('-k, --kb <name>', 'target knowledge base name')
  .option('-r, --role <role>', 'role/persona to tailor context for (e.g. backend-engineer)')
  .option('-o, --output <file>', 'output file path (default: stdout)')
  .option('--max-tokens <n>', 'maximum token budget for context', '8000')
  .action(contextCommand);

// memex list — list wiki pages
program
  .command('list')
  .description('List all wiki pages in the knowledge base')
  .option('-k, --kb <name>', 'target knowledge base name')
  .option('-t, --tag <tag>', 'filter by tag')
  .option('--orphans', 'show only orphan pages (no inbound links)')
  .action(listCommand);

// memex kb — manage multiple knowledge bases
program
  .command('kb')
  .description('Manage knowledge bases: list, switch, delete')
  .argument('[action]', 'action: list | switch | delete | info', 'list')
  .argument('[name]', 'knowledge base name')
  .action(kbCommand);

// memex config — configure memex settings
program
  .command('config')
  .description('Configure memex settings (LLM provider, API keys, defaults)')
  .argument('[action]', 'action: set | get | list', 'list')
  .argument('[key]', 'config key')
  .argument('[value]', 'config value')
  .action(configCommand);

// memex sync — sync context to AI agent config files
program
  .command('sync')
  .description('Sync knowledge base context to AI agent config files (CLAUDE.md, .cursorrules, etc.)')
  .option('-k, --kb <name>', 'target knowledge base name')
  .option('-r, --role <role>', 'role/persona to tailor context for (e.g. backend-engineer)')
  .option('-t, --target <targets>', 'comma-separated targets: claude,cursor,copilot,aider')
  .option('-d, --dir <dir>', 'target directory (default: current dir)')
  .option('--max-tokens <n>', 'maximum token budget for context', '8000')
  .action(syncCommand);

// memex distill — distill best practices from conversations
program
  .command('distill <source>')
  .description('Distill best practices from a conversation log or session transcript')
  .option('-k, --kb <name>', 'target knowledge base name')
  .option('-r, --role <role>', 'role/persona to distill for (e.g. backend-engineer)')
  .action(distillCommand);

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
