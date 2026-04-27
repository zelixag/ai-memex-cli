import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { installHooksCommand, resolveInstallBaseDir } from '../../src/commands/install-hooks.js';
import { homedir } from 'node:os';

describe('installHooksCommand', () => {
  const tempDirs: string[] = [];
  const originalCodexHome = process.env.CODEX_HOME;

  function makeTempDir(): string {
    const dir = join(process.cwd(), '.test-vaults', `hooks-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    if (originalCodexHome === undefined) {
      delete process.env.CODEX_HOME;
    } else {
      process.env.CODEX_HOME = originalCodexHome;
    }
    for (const d of tempDirs) {
      try { rmSync(d, { recursive: true, force: true }); } catch {}
    }
    tempDirs.length = 0;
  });

  it('installs Claude Code slash commands and the ai-memex skill template', async () => {
    const dir = makeTempDir();

    await installHooksCommand({ agent: 'claude-code', projectDir: dir }, dir);

    expect(existsSync(join(dir, '.claude', 'commands', 'memex', 'ingest.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude', 'commands', 'memex', 'query.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude', 'commands', 'memex', 'lint.md'))).toBe(true);
    const skillPath = join(dir, '.claude', 'skills', 'ai-memex', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);

    const skill = await readFile(skillPath, 'utf-8');
    expect(skill).toContain('name: ai-memex');
    expect(skill).toContain('Core rule: preserve source truth');
    expect(existsSync(join(dir, '.claude', 'skills', 'ai-memex', 'references', 'ingest-workflow.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude', 'skills', 'ai-memex', 'references', 'lint-workflow.md'))).toBe(true);

    const queryCommand = await readFile(join(dir, '.claude', 'commands', 'memex', 'query.md'), 'utf-8');
    expect(queryCommand).toContain('Use the installed `ai-memex` skill.');
    expect(queryCommand).toContain('Workflow: Query');
    expect(queryCommand).toContain('references/query-workflow.md');
    expect(queryCommand).toContain('Current agent: `claude-code`');
    expect(queryCommand).toContain('pass `--agent claude-code`');
  });

  it('does not write files during dry-run', async () => {
    const dir = makeTempDir();

    await installHooksCommand({ agent: 'claude-code', projectDir: dir, dryRun: true }, dir);

    expect(existsSync(join(dir, '.claude'))).toBe(false);
  });

  it('installs Codex AGENTS instructions and the ai-memex skill template', async () => {
    const dir = makeTempDir();
    const codexHome = join(dir, '.codex-home');
    process.env.CODEX_HOME = codexHome;

    await installHooksCommand({ agent: 'codex', projectDir: dir }, dir);

    const agentsPath = join(dir, 'AGENTS.md');
    const skillPath = join(dir, '.codex', 'skills', 'ai-memex', 'SKILL.md');
    const promptPath = join(codexHome, 'prompts', 'memex', 'distill.md');
    const aliasPromptPath = join(codexHome, 'prompts', 'memex-distill.md');
    expect(existsSync(agentsPath)).toBe(true);
    expect(existsSync(skillPath)).toBe(true);
    expect(existsSync(promptPath)).toBe(true);
    expect(existsSync(aliasPromptPath)).toBe(true);
    expect(existsSync(join(dir, '.codex', 'skills', 'ai-memex', 'references', 'distill-workflow.md'))).toBe(true);

    const agents = await readFile(agentsPath, 'utf-8');
    expect(agents).toContain('### Codex Entry Points');
    expect(agents).toContain('/memex-distill [input]');
    expect(agents).toContain('/memex-query <question>');
    expect(agents).toContain('memex distill --latest --agent codex');

    const skill = await readFile(skillPath, 'utf-8');
    expect(skill).toContain('/memex:distill');
    expect(skill).toContain('name: ai-memex');

    const prompt = await readFile(promptPath, 'utf-8');
    expect(prompt).toContain('Workflow: Distill');
    expect(prompt).toContain('User arguments: `$ARGUMENTS`');
    expect(prompt).toContain('pass `--agent codex`');

    const aliasPrompt = await readFile(aliasPromptPath, 'utf-8');
    expect(aliasPrompt).toContain('Workflow: Distill');
    expect(aliasPrompt).toContain('User arguments: `$ARGUMENTS`');
  });

  it('resolves project and user install base directories explicitly', () => {
    const dir = makeTempDir();
    const otherDir = makeTempDir();

    expect(resolveInstallBaseDir({ scope: 'project', projectDir: otherDir }, dir)).toBe(otherDir);
    expect(resolveInstallBaseDir({ scope: 'project' }, dir)).toBe(dir);
    expect(resolveInstallBaseDir({ scope: 'user', projectDir: otherDir }, dir)).toBe(homedir());
  });
});
