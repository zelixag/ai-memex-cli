import chalk from 'chalk';
import boxen from 'boxen';
import { table } from 'table';
import figures from 'figures';

export const icons = {
  success: chalk.green(figures.tick),
  error: chalk.red(figures.cross),
  warn: chalk.yellow(figures.warning),
  info: chalk.blue(figures.info),
  arrow: chalk.cyan(figures.arrowRight),
  bullet: chalk.gray(figures.bullet),
  star: chalk.yellow(figures.star),
  pointer: chalk.cyan(figures.pointer),
};

export function printBanner(title, subtitle) {
  const content = chalk.bold.cyan(title) + (subtitle ? '\n' + chalk.gray(subtitle) : '');
  console.log(
    boxen(content, {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );
}

export function printSuccess(msg) {
  console.log(`${icons.success} ${chalk.green(msg)}`);
}

export function printError(msg) {
  console.error(`${icons.error} ${chalk.red(msg)}`);
}

export function printWarn(msg) {
  console.warn(`${icons.warn} ${chalk.yellow(msg)}`);
}

export function printInfo(msg) {
  console.log(`${icons.info} ${chalk.blue(msg)}`);
}

export function printStep(step, msg) {
  console.log(`${chalk.cyan(`[${step}]`)} ${msg}`);
}

export function printSection(title) {
  console.log('\n' + chalk.bold.underline(title));
}

export function printTable(headers, rows) {
  if (rows.length === 0) {
    printInfo('No results found.');
    return;
  }
  const data = [
    headers.map(h => chalk.bold.cyan(h)),
    ...rows,
  ];
  console.log(table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '╭',
      topRight: '╮',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '╰',
      bottomRight: '╯',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼',
    },
    columns: {
      0: { alignment: 'left' },
    },
  }));
}

export function printMarkdown(content) {
  // Simple markdown rendering for terminal
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      console.log(chalk.bold.cyan('\n' + line.slice(2)));
    } else if (line.startsWith('## ')) {
      console.log(chalk.bold.yellow('\n' + line.slice(3)));
    } else if (line.startsWith('### ')) {
      console.log(chalk.bold('\n' + line.slice(4)));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      console.log(chalk.gray('  •') + ' ' + line.slice(2));
    } else if (line.startsWith('> ')) {
      console.log(chalk.italic.gray('  │ ' + line.slice(2)));
    } else if (line.startsWith('```')) {
      console.log(chalk.gray(line));
    } else {
      // Bold and italic inline
      const rendered = line
        .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
        .replace(/\*(.+?)\*/g, (_, t) => chalk.italic(t))
        .replace(/`(.+?)`/g, (_, t) => chalk.bgGray.white(` ${t} `));
      console.log(rendered);
    }
  }
}

export function printDivider() {
  console.log(chalk.gray('─'.repeat(60)));
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
