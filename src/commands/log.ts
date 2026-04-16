import { resolveVaultPath } from '../core/vault.js';
import { writeFileUtf8, readFileUtf8, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export interface LogOptions {
  action: string;
  target?: string;
  note?: string;
  vault?: string;
}

export async function logCommand(options: LogOptions, cwd: string): Promise<void> {
  const vault = await resolveVaultPath({ explicitPath: options.vault }, cwd);
  const logPath = `${vault}/log.md`;
  const date = new Date().toISOString().split('T')[0];
  const target = options.target || '';
  const note = options.note || '';
  const line = `## [${date}] ${options.action}${target ? ' | ' + target : ''}${note ? ' — ' + note : ''}\n\n`;

  const existing = (await pathExists(logPath)) ? await readFileUtf8(logPath) : `# LLM Wiki Log\n`;
  await writeFileUtf8(logPath, existing.trimEnd() + '\n\n' + line);
  logger.success(`Appended to ${logPath}`);
}
