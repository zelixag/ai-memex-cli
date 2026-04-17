import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

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
 * - `onStdout(chunk)` / `onStderr(chunk)` can be passed to intercept
 *   streaming chunks (e.g. to prefix each line with `[ingest] ` in the log).
 *   When not provided, raw chunks are written to `process.stdout` /
 *   `process.stderr`.
 * - Resolves with the captured stdout/stderr when the child exits 0.
 *   Rejects with an Error containing `.code` when the child exits non-zero
 *   or fails to start.
 */
export interface RunCommandStreamedOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
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
      cwd: options?.cwd,
      env: { ...process.env, ...options?.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: needsShell,
      windowsHide: true,
    });

    const outBuf: string[] = [];
    const errBuf: string[] = [];

    child.stdout?.setEncoding('utf-8');
    child.stderr?.setEncoding('utf-8');

    child.stdout?.on('data', (chunk: string) => {
      outBuf.push(chunk);
      if (options?.onStdout) options.onStdout(chunk);
      else process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk: string) => {
      errBuf.push(chunk);
      if (options?.onStderr) options.onStderr(chunk);
      else process.stderr.write(chunk);
    });

    child.on('error', (err) => {
      reject(err);
    });
    child.on('close', (code) => {
      const stdout = outBuf.join('');
      const stderr = errBuf.join('');
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
  try {
    await execFileAsync('which', [command]);
    return true;
  } catch {
    return false;
  }
}
