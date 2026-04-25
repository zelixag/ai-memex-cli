import type { CAC } from 'cac';
import { logger } from './utils/logger.js';

function isCacError(e: unknown): e is Error {
  return typeof e === 'object' && e !== null && (e as Error).name === 'CACError';
}

/**
 * Extra hints after CAC "Unknown option" (no stack trace; exit 2).
 */
function hintsForUnknownOption(message: string, argv: string[]): string[] {
  const m = message.match(/Unknown option `([^`]+)`/);
  const flag = m?.[1] ?? '';

  if (
    /^--?(deamon|demon|damon|deamn)$/i.test(flag)
  ) {
    return [
      '正确拼写是 --daemon（d-e-a-m-o-n，两个字母 a），表示后台守护进程。',
      '示例: memex watch --daemon',
      '查看 watch 全部选项: memex watch --help',
    ];
  }

  if (/Unknown option/i.test(message)) {
    const args = argv.slice(2);
    const sub = args.find((a) => a && !a.startsWith('-'));
    const help =
      sub && sub !== 'help' && !sub.startsWith('-')
        ? `memex ${sub} --help`
        : 'memex --help';
    return [`不认识的选项。请运行「${help}」查看可用参数。`];
  }

  return [];
}

/**
 * Run cac.parse(); on CACError print a short message + hints (no Node stack).
 */
export function parseCliWithFriendlyErrors(cli: CAC, argv = process.argv): void {
  try {
    cli.parse(argv);
  } catch (e: unknown) {
    if (isCacError(e)) {
      const msg = (e as Error).message;
      const hints = hintsForUnknownOption(msg, argv);
      // One block on stderr so order is stable (stdout/stderr interleave badly on Windows shells).
      logger.warn([msg, ...hints].filter(Boolean).join('\n'));
      process.exit(2);
    }
    throw e;
  }
}
