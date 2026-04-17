import { resolve } from 'node:path';
import { writeFileUtf8, readFileUtf8, pathExists } from '../utils/fs.js';
import { writeConfig } from '../core/config.js';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SCENES = ['personal', 'research', 'reading', 'team'];
const TYPES = ['entities', 'concepts', 'sources', 'summaries'];

export interface InitOptions {
  scope: 'global' | 'local';
  scene?: string;
  path?: string;
}

export async function initCommand(options: InitOptions, cwd: string): Promise<void> {
  const basePath = options.path ? resolve(cwd, options.path) : cwd;
  const vaultPath = options.scope === 'global'
    ? `${basePath}/.llmwiki/global`
    : `${basePath}/.llmwiki/local`;

  // Check if vault already exists
  if (await pathExists(`${vaultPath}/AGENTS.md`)) {
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

    // AGENTS.md
    const agentsTemplate = await loadTemplate('AGENTS.md');
    await writeFileUtf8(`${vaultPath}/AGENTS.md`, agentsTemplate);

    // index.md
    const date = new Date().toISOString().split('T')[0];
    await writeFileUtf8(`${vaultPath}/index.md`, `# LLM Wiki Index\n\n> Last updated: ${date}\n`);

    // log.md
    await writeFileUtf8(`${vaultPath}/log.md`, `# LLM Wiki Log\n`);

    // config.json
    await writeConfig(vaultPath, {});

    // .gitignore
    await writeFileUtf8(`${vaultPath}/.llmwiki/.gitignore`, 'config.json\n');

    logger.success(`Initialized global vault at ${vaultPath}`);
    logger.info('Directory structure:');
    logger.info('  raw/     — Drop source documents here');
    logger.info('  wiki/    — Agent-maintained wiki pages');
    logger.info('  AGENTS.md — Schema for LLM agents');
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

## @include ../global/wiki/relevant-page.md
## @include ./wiki/*.md

## Project-Specific Conventions

Add project-specific conventions here.
`;
    await writeFileUtf8(`${vaultPath}/AGENTS.md`, localAgents);

    logger.success(`Initialized local vault at ${vaultPath}`);
    logger.info('Edit AGENTS.md to add @include directives for relevant global wiki pages.');
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
