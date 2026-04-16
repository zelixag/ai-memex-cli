import { resolveGlobalVaultPath } from '../core/vault.js';
import { readFileUtf8, pathExists, listMarkdownFiles, normalizePath, defaultRawDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { runCommand, commandExists } from '../utils/exec.js';
import { readConfig } from '../core/config.js';
import { basename, join } from 'node:path';

export interface IngestOptions {
  /** File path, directory path, or omit to default to ~/.llmwiki/global/raw */
  target?: string;
  noLlm?: boolean;
  dryRun?: boolean;
  vault?: string;
}

export async function ingestCommand(options: IngestOptions, cwd: string): Promise<void> {
  const vault = await resolveGlobalVaultPath({ explicitPath: options.vault }, cwd);
  const config = await readConfig(vault);

  // ── Resolve target ────────────────────────────────────────────────────────
  let targetFiles: string[] = [];

  // Default: no argument → ingest everything in vault's raw/
  if (!options.target) {
    const rawDir = join(vault, 'raw').replace(/\\/g, '/');
    targetFiles = await listMarkdownFiles(rawDir);
    if (targetFiles.length === 0) {
      logger.info(`No raw files found in ${rawDir}`);
      logger.info('Use `memex fetch <url>` to add content, or drop .md files into raw/');
      return;
    }
    logger.info(`Found ${targetFiles.length} raw file(s) in ${rawDir}`);
  } else {
    // Normalize the provided path (handles ~, backslashes, relative paths)
    const normalized = normalizePath(options.target, cwd);

    if (!(await pathExists(normalized))) {
      logger.error(`Path not found: ${normalized}`);
      logger.info('Tip: omit the argument to ingest all files in ~/.llmwiki/global/raw/');
      return;
    }

    // Check if it's a directory or a file
    const { stat } = await import('node:fs/promises');
    const info = await stat(normalized);

    if (info.isDirectory()) {
      targetFiles = await listMarkdownFiles(normalized);
      if (targetFiles.length === 0) {
        logger.info(`No .md files found in ${normalized}`);
        return;
      }
      logger.info(`Found ${targetFiles.length} file(s) in ${normalized}`);
    } else {
      targetFiles = [normalized];
    }
  }

  // ── Read vault schema ─────────────────────────────────────────────────────
  const agentsPath = join(vault, 'AGENTS.md').replace(/\\/g, '/');
  if (!(await pathExists(agentsPath))) {
    logger.error(`No AGENTS.md found in vault: ${vault}`);
    logger.info('Run `memex init` first.');
    return;
  }
  const agentsContent = await readFileUtf8(agentsPath);

  const indexPath = join(vault, 'index.md').replace(/\\/g, '/');
  const indexContent = (await pathExists(indexPath)) ? await readFileUtf8(indexPath) : '';

  // ── Process each file ─────────────────────────────────────────────────────
  for (const file of targetFiles) {
    const sourceContent = await readFileUtf8(file);
    const sourceName = basename(file);
    const prompt = buildIngestPrompt(agentsContent, indexContent, sourceContent, sourceName, vault);

    if (options.dryRun) {
      logger.info(`--- DRY RUN: ${sourceName} ---`);
      console.log(prompt);
      logger.info(`--- END DRY RUN ---`);
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
      logger.info('Or use --dry-run to preview the prompt.');
      return;
    }

    try {
      logger.info(`Ingesting ${sourceName}...`);
      const { stdout, stderr } = await runCommand(agentBin, [...agentParts.slice(1), prompt], {
        cwd: vault,
      });
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
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
