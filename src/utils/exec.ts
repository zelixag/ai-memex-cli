import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve as pathResolve } from 'node:path';

const execFileAsync = promisify(execFile);

/**
 * Decode stderr bytes from a Windows child (often cmd.exe or OEM/GBK tools).
 * Prefer UTF-8; if replacement chars appear, try GB18030 which matches common
 * Chinese-locale Windows console output.
 */
export function decodeChildStderr(buf: Buffer): string {
  if (buf.length === 0) return '';
  const asUtf8 = buf.toString('utf8');
  const bad = (asUtf8.match(/\uFFFD/g) ?? []).length;
  if (bad === 0) return asUtf8;
  if (process.platform === 'win32') {
    try {
      const gb = new TextDecoder('gb18030').decode(buf);
      const badGb = (gb.match(/\uFFFD/g) ?? []).length;
      if (badGb < bad) return gb;
    } catch {
      /* ignore */
    }
  }
  return asUtf8;
}

export async function runCommand(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv }
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(command, args, {
    cwd: options?.cwd,
    env: { ...process.env, ...options?.env },
    maxBuffer: 10 * 1024 * 1024,
  });
}

/**
 * Run a child process while streaming its stdout/stderr to the parent in
 * real time, and at the same time capturing them into strings for the
 * caller. Meant for long-running agent invocations so progress is visible
 * in `memex watch`'s log (or the user's terminal) as it happens, instead
 * of arriving in one big lump at the very end.
 *
 * - `onStdout(chunk)` can be passed to intercept streaming stdout chunks
 *   (e.g. to prefix each line with `[ingest] ` in the log). When not provided,
 *   raw chunks are written to `process.stdout`.
 * - Stderr is buffered until the child exits, then decoded (UTF-8 with a
 *   GB18030 fallback on Windows) and delivered in one piece: either to
 *   `onStderr(full)` if provided, or to `process.stderr`.
 * - Resolves with the captured stdout/stderr when the child exits 0.
 *   Rejects with an Error containing `.code` when the child exits non-zero
 *   or fails to start.
 */
export interface RunCommandStreamedOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  onStdout?: (chunk: string) => void;
  /** Called once after exit with the full decoded stderr string (may be empty). */
  onStderr?: (full: string) => void;
}

export function runCommandStreamed(
  command: string,
  args: string[],
  options?: RunCommandStreamedOptions,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    // On Windows, `.cmd`/`.bat` shims (common for npm-installed CLIs such
    // as `claude.cmd`) cannot be launched directly via `spawn` without a
    // shell. But enabling `shell: true` unconditionally makes Node invoke
    // `cmd.exe /d /s /c`, and when the parent process is detached from a
    // console (e.g. `memex watch --daemon`), Windows pops a *new* console
    // window for every child — one `claude` window per ingest call. We
    // therefore only shell out for known shim extensions, and always set
    // `windowsHide: true` so no stray window flashes appear even then.
    const isWin = process.platform === 'win32';
    const needsShell = isWin && /\.(cmd|bat|ps1)$/i.test(command);

    const child = spawn(command, args, {
      cwd: options?.cwd ? pathResolve(options.cwd) : undefined,
      env: { ...process.env, ...options?.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: needsShell,
      windowsHide: true,
    });

    const outBuf: string[] = [];
    const errChunks: Buffer[] = [];

    child.stdout?.setEncoding('utf-8');

    child.stdout?.on('data', (chunk: string) => {
      outBuf.push(chunk);
      if (options?.onStdout) options.onStdout(chunk);
      else process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
      errChunks.push(buf);
    });

    child.on('error', (err) => {
      reject(err);
    });
    child.on('close', (code) => {
      const stdout = outBuf.join('');
      const stderr = decodeChildStderr(Buffer.concat(errChunks));
      if (stderr) {
        if (options?.onStderr) options.onStderr(stderr);
        else process.stderr.write(stderr);
      }
      if (code === 0) {
        resolve({ stdout, stderr, code: 0 });
      } else {
        const msg = `child exited with code ${code ?? 'null'}${stderr ? `: ${stderr.slice(-500)}` : ''}`;
        const e = new Error(msg) as Error & { code?: number | null; stdout?: string; stderr?: string };
        e.code = code;
        e.stdout = stdout;
        e.stderr = stderr;
        reject(e);
      }
    });
  });
}

export async function commandExists(command: string): Promise<boolean> {
  return (await resolveCommandPath(command)) !== null;
}

export async function resolveCommandPath(command: string): Promise<string | null> {
  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    const { stdout } = await execFileAsync(which, [command]);
    const raw = stdout.trim().split(/\r?\n/)[0]?.trim() ?? '';
    if (!raw) return null;
    // On Windows, npm global shims are .cmd files. `where` may return the bare
    // name. Detect by checking whether the file actually exists with .cmd appended.
    if (process.platform === 'win32') {
      const { existsSync } = await import('node:fs');
      if (existsSync(raw + '.cmd')) return raw + '.cmd';
    }
    return raw;
  } catch {
    return null;
  }
}
