import { resolveGlobalVaultPath } from '../core/vault.js';
import { readFileUtf8, writeFileUtf8, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { parseJsonlLines, mechanicalExtract, buildDistillPrompt } from '../core/distiller.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { readConfig } from '../core/config.js';
import { basename } from 'node:path';

export interface DistillOptions {
  input: string;
  out?: string;
  noLlm?: boolean;
  vault?: string;
}

export async function distillCommand(options: DistillOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);

  if (!(await pathExists(options.input))) {
    logger.error(`Input file not found: ${options.input}`);
    return;
  }

  const raw = await readFileUtf8(options.input);
  const lines = parseJsonlLines(raw);

  if (lines.length === 0) {
    logger.error('No valid lines found in input file.');
    return;
  }

  let output: string;
  if (options.noLlm) {
    output = mechanicalExtract(lines);
    logger.info('Using mechanical extraction (--no-llm)');
  } else {
    const mechanical = mechanicalExtract(lines);
    const prompt = buildDistillPrompt(mechanical);
    const agentParts = config.distill.agentCommand.split(' ');
    const agentBin = agentParts[0];

    if (!(await commandExists(agentBin))) {
      logger.warn(`Agent command "${agentBin}" not found. Falling back to mechanical extraction.`);
      logger.info(`Install Claude Code CLI: npm install -g @anthropic-ai/claude-code`);
      output = mechanical;
    } else {
      try {
        const { stdout } = await runCommand(agentBin, [...agentParts.slice(1), prompt]);
        output = stdout;
      } catch (e) {
        logger.error(`Failed to run distill agent: ${e instanceof Error ? e.message : String(e)}`);
        logger.info('Falling back to mechanical extraction.');
        output = mechanical;
      }
    }
  }

  const date = new Date().toISOString().split('T')[0];
  const inputName = basename(options.input, '.jsonl');
  const outPath = options.out || `${vault}/raw/sessions/session-${date}-${inputName}.md`;
  await writeFileUtf8(outPath, output);
  logger.success(`Distilled to ${outPath}`);
}
