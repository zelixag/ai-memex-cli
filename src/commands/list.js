import chalk from 'chalk';
import { format } from 'date-fns';

import { printBanner, printError, printInfo, printTable, printDivider, printSection } from '../lib/ui.js';
import { getActiveKbPath } from '../lib/config.js';
import { listWikiPages, findOrphanPages, getKbConfig } from '../lib/kb.js';

export async function listCommand(options) {
  let kbPath;
  try {
    kbPath = getActiveKbPath(options.kb);
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }

  const kbConfig = getKbConfig(kbPath);
  printBanner(`memex list — ${kbConfig.name || 'Knowledge Base'}`, `${kbPath}`);

  let pages;
  try {
    if (options.orphans) {
      pages = await findOrphanPages(kbPath);
      printSection('Orphan Pages (no inbound links)');
    } else {
      pages = await listWikiPages(kbPath, { tag: options.tag });
    }
  } catch (err) {
    printError(`Failed to list pages: ${err.message}`);
    process.exit(1);
  }

  if (pages.length === 0) {
    if (options.orphans) {
      printInfo('No orphan pages found!');
    } else if (options.tag) {
      printInfo(`No pages found with tag: ${options.tag}`);
    } else {
      printInfo('No wiki pages yet. Run `memex ingest <source>` to add knowledge.');
    }
    return;
  }

  // Group pages by directory
  const groups = {};
  for (const page of pages) {
    const parts = page.name.split('/');
    const group = parts.length > 1 ? parts[0] : 'root';
    if (!groups[group]) groups[group] = [];
    groups[group].push(page);
  }

  for (const [group, groupPages] of Object.entries(groups)) {
    if (group !== 'root') {
      console.log('');
      console.log(chalk.bold.cyan(`  ${group}/`));
    }

    const rows = groupPages.map(page => {
      const name = page.name.includes('/') ? page.name.split('/').slice(1).join('/') : page.name;
      const tags = (page.tags || []).map(t => chalk.gray(`#${t}`)).join(' ');
      const words = chalk.gray(`${page.wordCount}w`);
      const updated = page.updated ? chalk.gray(page.updated) : chalk.gray('—');
      return [
        chalk.cyan(name),
        (page.summary || '').slice(0, 55) + ((page.summary || '').length > 55 ? '…' : ''),
        tags,
        words,
        updated,
      ];
    });

    printTable(['Page', 'Summary', 'Tags', 'Words', 'Updated'], rows);
  }

  console.log('');
  printInfo(`Total: ${pages.length} page(s)`);

  // Show all unique tags
  const allTags = [...new Set(pages.flatMap(p => p.tags || []))].sort();
  if (allTags.length > 0) {
    console.log(`  Tags: ${allTags.map(t => chalk.gray(`#${t}`)).join(' ')}`);
  }
}
