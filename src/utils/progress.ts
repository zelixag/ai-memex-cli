/**
 * progress.ts — 轻量级终端进度显示（无第三方依赖）
 *
 * 提供两种能力：
 *  1. `createProgressBar(total, title)`：批量任务的进度条。
 *     - TTY：在 stderr 单行回刷 `[####····] 3/10 (30%)  label`。
 *     - 非 TTY（CI / 管道）：退化为每 10% 一行日志，避免刷屏。
 *  2. `createSpinner(text)`：不定长任务的旋转指示器。
 *     - TTY：10 帧旋转；非 TTY：打印一次提示，`stop()` 再打结果。
 *
 * 所有 I/O 都走 stderr，保证命令自身的 stdout 不被干扰（便于管道解析）。
 */

import pc from 'picocolors';

// ── Progress bar ─────────────────────────────────────────────────────────────

export interface ProgressBar {
  /** 完成一项；label 显示在条后面（如当前文件名） */
  tick(label?: string): void;
  /** 结束进度条；传入 summary 会替换条为一行总结 */
  done(summary?: string): void;
  /** 直接跳到指定进度（不推荐，通常用 tick） */
  set(current: number, label?: string): void;
}

const BAR_WIDTH = 24;
const isTTY = (): boolean => Boolean(process.stderr.isTTY);

export function createProgressBar(total: number, title = ''): ProgressBar {
  if (total <= 0) {
    return {
      tick() {},
      done(summary) {
        if (summary) process.stderr.write(summary + '\n');
      },
      set() {},
    };
  }

  let current = 0;
  let lastPct = -1;
  const startedAt = Date.now();
  const tty = isTTY();

  // 非 TTY：只在开始时打印一行
  if (!tty) {
    process.stderr.write(`${pc.dim('▸')} ${title || 'progress'}: 0/${total}\n`);
  }

  const render = (label?: string): void => {
    const pct = Math.min(100, Math.floor((current / total) * 100));
    if (tty) {
      const filled = Math.round((pct / 100) * BAR_WIDTH);
      const bar = pc.cyan('█'.repeat(filled)) + pc.gray('░'.repeat(BAR_WIDTH - filled));
      const head = title ? `${title} ` : '';
      const suffix = label ? `  ${pc.dim(truncate(label, 40))}` : '';
      const line = `${head}${bar} ${pc.bold(`${current}/${total}`)} ${pc.dim(`(${pct}%)`)}${suffix}`;
      clearLine();
      process.stderr.write(line);
    } else {
      // 每跨过一个 10% 档位打印一行
      const tick10 = Math.floor(pct / 10);
      if (tick10 !== lastPct) {
        lastPct = tick10;
        process.stderr.write(`  ${title || 'progress'}: ${current}/${total} (${pct}%)\n`);
      }
    }
  };

  return {
    tick(label) {
      current = Math.min(current + 1, total);
      render(label);
    },
    set(n, label) {
      current = Math.max(0, Math.min(n, total));
      render(label);
    },
    done(summary) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      if (tty) {
        clearLine();
        if (summary) {
          process.stderr.write(`${pc.green('✔')} ${summary} ${pc.dim(`(${elapsed}s)`)}\n`);
        } else if (title) {
          process.stderr.write(
            `${pc.green('✔')} ${title} ${pc.bold(`${current}/${total}`)} ${pc.dim(`(${elapsed}s)`)}\n`
          );
        }
      } else if (summary) {
        process.stderr.write(`${summary} (${elapsed}s)\n`);
      }
    },
  };
}

// ── Spinner ──────────────────────────────────────────────────────────────────

export interface Spinner {
  /** 更新提示文本（原地刷新） */
  update(text: string): void;
  /** 结束 spinner，并以相应的状态符收尾 */
  stop(finalText?: string, status?: 'ok' | 'err' | 'warn' | 'info'): void;
}

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text: string): Spinner {
  const tty = isTTY();
  const startedAt = Date.now();
  let currentText = text;
  let timer: NodeJS.Timeout | null = null;
  let frame = 0;

  const draw = (): void => {
    clearLine();
    process.stderr.write(
      `${pc.cyan(FRAMES[frame % FRAMES.length])} ${currentText} ${pc.dim(`(${elapsedSec(startedAt)}s)`)}`
    );
    frame++;
  };

  if (tty) {
    draw();
    timer = setInterval(draw, 80);
  } else {
    process.stderr.write(`${pc.dim('▸')} ${text}...\n`);
  }

  return {
    update(newText) {
      currentText = newText;
      if (tty) draw();
      else process.stderr.write(`${pc.dim('▸')} ${newText}...\n`);
    },
    stop(finalText, status = 'ok') {
      if (timer) clearInterval(timer);
      timer = null;
      const symbol =
        status === 'ok'
          ? pc.green('✔')
          : status === 'err'
          ? pc.red('✖')
          : status === 'warn'
          ? pc.yellow('⚠')
          : pc.blue('ℹ');
      if (tty) {
        clearLine();
        if (finalText) {
          process.stderr.write(
            `${symbol} ${finalText} ${pc.dim(`(${elapsedSec(startedAt)}s)`)}\n`
          );
        }
      } else if (finalText) {
        process.stderr.write(`${finalText} (${elapsedSec(startedAt)}s)\n`);
      }
    },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function clearLine(): void {
  if (isTTY()) {
    process.stderr.write('\r\x1b[2K');
  }
}

function elapsedSec(startedAt: number): string {
  return ((Date.now() - startedAt) / 1000).toFixed(1);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return '…' + s.slice(s.length - max + 1);
}
