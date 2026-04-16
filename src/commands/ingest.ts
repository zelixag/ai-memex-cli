import { resolveGlobalVaultPath } from '../core/vault.js';
import { readFileUtf8, writeFileUtf8, pathExists, listMarkdownFiles } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { readConfig } from '../core/config.js';
import { basename } from 'node:path';

export interface IngestOptions {
  target: string;
  noLlm?: boolean;
  dryRun?: boolean;
  vault?: string;
}

export async function ingestCommand(options: IngestOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);

  // Resolve target files
  let targetFiles: string[] = [];
  if (options.target === '--all') {
    targetFiles = await listMarkdownFiles(`${vault}/raw`);
    if (targetFiles.length === 0) {
      logger.info('No raw files to ingest.');
      return;
    }
    logger.info(`Found ${targetFiles.length} raw file(s) to ingest.`);
  } else {
    const targetPath = options.target.startsWith('/') ? options.target : `${cwd}/${options.target}`;
    if (!(await pathExists(targetPath))) {
      logger.error(`Target file not found: ${targetPath}`);
      return;
    }
    targetFiles = [targetPath];
  }

  // Read AGENTS.md for schema
  const agentsPath = `${vault}/AGENTS.md`;
  if (!(await pathExists(agentsPath))) {
    logger.error('No AGENTS.md found in vault. Run `memex init` first.');
    return;
  }
  const agentsContent = await readFileUtf8(agentsPath);

  // Read current index.md for context
  const indexPath = `${vault}/index.md`;
  const indexContent = (await pathExists(indexPath)) ? await readFileUtf8(indexPath) : '';

  for (const file of targetFiles) {
    const sourceContent = await readFileUtf8(file);
    const sourceName = basename(file);

    // Build the prompt for the agent
    const prompt = buildIngestPrompt(agentsContent, indexContent, sourceContent, sourceName, vault);

    if (options.dryRun) {
      console.log('--- DRY RUN: Prompt that would be sent to agent ---');
      console.log(prompt);
      console.log('--- END DRY RUN ---');
      continue;
    }

    if (options.noLlm) {
      logger.error('Ingest requires an LLM agent. Remove --no-llm flag.');
      logger.info('The agent reads the source, identifies entities/concepts, and writes wiki pages.');
      return;
    }

    const agentParts = config.ingest.agentCommand.split(' ');
    const agentBin = agentParts[0];

    if (!(await commandExists(agentBin))) {
      logger.error(`Agent command "${agentBin}" not found.`);
      logger.info('Install Claude Code CLI: npm install -g @anthropic-ai/claude-code');
      logger.info('Or use --dry-run to see the prompt.');
      return;
    }

    try {
      logger.info(`Ingesting ${sourceName}...`);
      const { stdout, stderr } = await runCommand(agentBin, [...agentParts.slice(1), prompt], {
        cwd: vault,
      });
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      logger.success(`Ingested ${sourceName}`);
    } catch (e) {
      logger.error(`Failed to ingest ${sourceName}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

function buildIngestPrompt(
  agentsContent: string,
  indexContent: string,
  sourceContent: string,
  sourceName: string,
  vaultPath: string
): string {
  return `You are a knowledge base maintenance agent. Your task is to ingest a raw source document into the LLM wiki.

## Wiki Schema (AGENTS.md)

${agentsContent}

## Current Index

${indexContent || '(empty)'}

## Source Document: ${sourceName}

${sourceContent}

## Instructions

1. Read the source document above carefully.
2. Identify the appropriate scene (personal/research/reading/team) and types (entity/concept/source/summary).
3. Create or update wiki pages in the vault at: ${vaultPath}/wiki/<scene>/<type>/
4. Each page MUST have valid YAML frontmatter with: name, description, type, scene, tags, updated, sources.
5. Use [[page-name]] syntax for internal cross-references.
6. Update ${vaultPath}/index.md with entries for any new pages.
7. Append to ${vaultPath}/log.md: ## [${new Date().toISOString().split('T')[0]}] ingest | ${sourceName}
8. Do NOT modify the raw source file.

Write the files now.`;
}
