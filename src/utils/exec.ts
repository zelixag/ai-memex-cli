import { execFile } from 'node:child_process';
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

export async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync('which', [command]);
    return true;
  } catch {
    return false;
  }
}
