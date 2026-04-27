import { resolve } from 'node:path';
import { writeFileUtf8, readFileUtf8, pathExists } from '../utils/fs.js';
import { readGlobalConfig, writeConfig } from '../core/config.js';
import { logger } from '../utils/logger.js';
import {
  vaultSchemaFilenameForAgent,
  isKnownAgentId,
  type AgentId,
} from '../core/agent-adapter.js';
import { findExistingVaultSchemaFile } from '../core/vault.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Scenes are an OPEN set: `init` seeds these recommended starters, but users
// are free to mkdir new scenes (e.g. `competitive-analysis/`, `trip-planning/`)
// to fit their domain. See RECOMMENDED_SCENES in core/schema.ts.
const SCENES = ['personal', 'research', 'reading', 'team'];
const TYPES = ['entities', 'concepts', 'sources', 'comparisons', 'overviews', 'syntheses'];

export interface InitOptions {
  scope: 'global' | 'local';
  scene?: string;
  path?: string;
  /**
   * When `scope` is `global`, picks the wiki schema basename (e.g. `CLAUDE.md`
   * for claude-code). Defaults from `~/.llmwiki/config.json` then `claude-code`.
   */
  agent?: AgentId | string;
}

export async function initCommand(options: InitOptions, cwd: string): Promise<void> {
  const basePath = options.path ? resolve(cwd, options.path) : cwd;
  const vaultPath =
    options.scope === 'global'
      ? join(basePath, '.llmwiki').replace(/\\/g, '/')
      : join(basePath, '.llmwiki', 'local').replace(/\\/g, '/');

  if (options.scope === 'global') {
    const legacyRoot = join(basePath, '.llmwiki', 'global').replace(/\\/g, '/');
    const legacyHas = (await findExistingVaultSchemaFile(legacyRoot)) !== null;
    const flatHas = (await findExistingVaultSchemaFile(vaultPath)) !== null;
    if (legacyHas && !flatHas) {
      logger.warn(
        `A legacy wiki vault already exists at ${legacyRoot}. ` +
          'Use that tree or remove it before creating a flat `.llmwiki` vault here.',
      );
      return;
    }
  }

  // Check if vault already exists
  if ((await findExistingVaultSchemaFile(vaultPath)) !== null) {
    logger.warn(`Vault already exists at ${vaultPath}`);
    return;
  }

  if (options.scope === 'global') {
    // Create full directory structure for global vault
    for (const scene of SCENES) {
      for (const type of TYPES) {
        await writeFileUtf8(`${vaultPath}/wiki/${scene}/${type}/.gitkeep`, '');
      }
      await writeFileUtf8(`${vaultPath}/raw/${scene}/.gitkeep`, '');
    }
    // Sessions distilled from agent transcripts live under team scene
    // (they tend to be team-shareable knowledge). Override with `memex distill --scene <x>`.
    await writeFileUtf8(`${vaultPath}/raw/team/sessions/.gitkeep`, '');

    let initAgent: AgentId = 'claude-code';
    if (options.agent) {
      if (isKnownAgentId(String(options.agent))) initAgent = options.agent as AgentId;
      else logger.warn(`Unknown --agent "${options.agent}", using claude-code`);
    } else {
      const gc = await readGlobalConfig();
      if (gc.agent && isKnownAgentId(gc.agent)) initAgent = gc.agent;
    }
    const schemaFile = vaultSchemaFilenameForAgent(initAgent);
    const agentsTemplate = await loadTemplate('AGENTS.md');
    await writeFileUtf8(`${vaultPath}/${schemaFile}`, agentsTemplate);

    // index.md
    const date = new Date().toISOString().split('T')[0];
    await writeFileUtf8(`${vaultPath}/index.md`, `# LLM Wiki Index\n\n> Last updated: ${date}\n`);

    // log.md
    await writeFileUtf8(`${vaultPath}/log.md`, `# LLM Wiki Log\n`);

    // config.json (record agent so later commands resolve the right schema file)
    await writeConfig(vaultPath, { agent: initAgent });

    // .gitignore
    await writeFileUtf8(`${vaultPath}/.llmwiki/.gitignore`, 'config.json\n');

    logger.success(`Initialized wiki vault at ${vaultPath}`);
    logger.info('Directory structure:');
    logger.info('  raw/     — Drop source documents here');
    logger.info('  wiki/    — Agent-maintained wiki pages');
    logger.info(`  ${schemaFile} — Wiki schema for LLM agents`);
  } else {
    // Local vault: minimal structure
    await writeFileUtf8(`${vaultPath}/wiki/.gitkeep`, '');

    // Local AGENTS.md with @include examples
    const localAgents = `---
name: Project Wiki
description: Project-specific knowledge base
---

# Project Wiki Schema

## Context Sources

## @include ../wiki/relevant-page.md
## @include ./wiki/*.md

## Project-Specific Conventions

Add project-specific conventions here.
`;
    await writeFileUtf8(`${vaultPath}/AGENTS.md`, localAgents);

    logger.success(`Initialized local vault at ${vaultPath}`);
    logger.info('Edit AGENTS.md to add @include directives for relevant wiki pages.');
  }
}

async function loadTemplate(name: string): Promise<string> {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const templateDir = join(dirname(currentFile), '..', '..', 'templates');
    const templatePath = join(templateDir, name);
    if (await pathExists(templatePath)) {
      return readFileUtf8(templatePath);
    }
  } catch { /* ignore */ }
  return `# LLM Wiki Schema\n\nSee documentation for schema details.\n`;
}
