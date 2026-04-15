import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync } from 'fs';

import { printBanner, printSuccess, printError, printInfo, printTable, printDivider } from '../lib/ui.js';
import { globalConfig } from '../lib/config.js';
import { getKbConfig, listWikiPages } from '../lib/kb.js';

export async function kbCommand(action, name) {
  action = action || 'list';

  switch (action) {
    case 'list':
      await listKbs();
      break;
    case 'switch':
      await switchKb(name);
      break;
    case 'delete':
      await deleteKb(name);
      break;
    case 'info':
      await infoKb(name);
      break;
    default:
      printError(`Unknown action: ${action}. Use: list | switch | delete | info`);
      process.exit(1);
  }
}

async function listKbs() {
  printBanner('memex kb', 'Manage knowledge bases');

  const activeKbs = globalConfig.get('activeKbs') || {};
  const defaultKb = globalConfig.get('defaultKb');

  if (Object.keys(activeKbs).length === 0) {
    printInfo('No knowledge bases registered. Run `memex init` to create one.');
    return;
  }

  const rows = [];
  for (const [name, path] of Object.entries(activeKbs)) {
    const exists = existsSync(path);
    const isDefault = name === defaultKb;
    const config = exists ? getKbConfig(path) : {};

    rows.push([
      (isDefault ? chalk.green('● ') : '  ') + chalk.cyan(name),
      config.type || '—',
      config.purpose?.slice(0, 40) || '—',
      exists ? chalk.green('ok') : chalk.red('missing'),
      path.replace(process.env.HOME, '~'),
    ]);
  }

  printTable(['Name', 'Type', 'Purpose', 'Status', 'Path'], rows);
  console.log('');
  printInfo(`Default: ${defaultKb || '(none)'}`);
  console.log('');
  console.log('  memex kb switch <name>   — Set default knowledge base');
  console.log('  memex kb info <name>     — Show detailed info');
}

async function switchKb(name) {
  if (!name) {
    const activeKbs = globalConfig.get('activeKbs') || {};
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: 'Select default knowledge base:',
      choices: Object.keys(activeKbs),
    }]);
    name = selected;
  }

  const activeKbs = globalConfig.get('activeKbs') || {};
  if (!activeKbs[name]) {
    printError(`Knowledge base "${name}" not found.`);
    process.exit(1);
  }

  globalConfig.set('defaultKb', name);
  printSuccess(`Default knowledge base set to: ${name}`);
}

async function deleteKb(name) {
  if (!name) {
    printError('Please provide a knowledge base name: memex kb delete <name>');
    process.exit(1);
  }

  const activeKbs = globalConfig.get('activeKbs') || {};
  if (!activeKbs[name]) {
    printError(`Knowledge base "${name}" not found.`);
    process.exit(1);
  }

  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Remove "${name}" from registry? (Files will NOT be deleted)`,
    default: false,
  }]);

  if (!confirm) {
    printInfo('Cancelled.');
    return;
  }

  delete activeKbs[name];
  globalConfig.set('activeKbs', activeKbs);

  if (globalConfig.get('defaultKb') === name) {
    const remaining = Object.keys(activeKbs);
    globalConfig.set('defaultKb', remaining[0] || '');
  }

  printSuccess(`Removed "${name}" from registry.`);
}

async function infoKb(name) {
  const activeKbs = globalConfig.get('activeKbs') || {};
  const defaultKb = globalConfig.get('defaultKb');

  if (!name) {
    name = defaultKb;
  }

  if (!name || !activeKbs[name]) {
    printError('No knowledge base specified. Use: memex kb info <name>');
    process.exit(1);
  }

  const path = activeKbs[name];
  const config = getKbConfig(path);

  printBanner(`KB: ${name}`, path);
  printDivider();
  console.log(`  Name:      ${chalk.cyan(config.name || name)}`);
  console.log(`  Type:      ${config.type || '—'}`);
  console.log(`  Purpose:   ${config.purpose || '—'}`);
  console.log(`  Created:   ${config.created || '—'}`);
  console.log(`  Default:   ${name === defaultKb ? chalk.green('yes') : 'no'}`);
  console.log(`  Path:      ${path}`);

  try {
    const pages = await listWikiPages(path);
    console.log(`  Pages:     ${pages.length}`);
    const allTags = [...new Set(pages.flatMap(p => p.tags || []))].sort();
    if (allTags.length) {
      console.log(`  Tags:      ${allTags.join(', ')}`);
    }
  } catch {
    console.log(`  Pages:     (error reading)`);
  }
  printDivider();
}
