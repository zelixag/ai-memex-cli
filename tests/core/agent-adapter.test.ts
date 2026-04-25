import { describe, it, expect } from 'vitest';
import {
  AGENT_PROFILES,
  buildAgentArgs,
  shouldSpillPromptToFile,
  prepareAgentPromptArgs,
  vaultSchemaFilenameForAgent,
} from '../../src/core/agent-adapter.js';

describe('AGENT_PROFILES', () => {
  it('should have all expected agents', () => {
    const expectedAgents = ['claude-code', 'codex', 'opencode', 'cursor', 'gemini-cli', 'aider', 'continue', 'generic'];
    for (const agent of expectedAgents) {
      expect(AGENT_PROFILES).toHaveProperty(agent);
    }
  });

  it('should have required fields for each agent', () => {
    for (const [id, profile] of Object.entries(AGENT_PROFILES)) {
      expect(profile.name).toBeTruthy();
      expect(profile.bin).toBeTruthy();
      expect(profile.contextFile).toBeTruthy();
      expect(profile.installHint).toBeTruthy();
    }
  });

  it('should have sessionDir metadata for every supported agent with a known session store', () => {
    const agentsWithKnownSessionStores = [
      'claude-code',
      'codex',
      'opencode',
      'gemini-cli',
      'aider',
    ] as const;

    for (const agent of agentsWithKnownSessionStores) {
      expect(AGENT_PROFILES[agent].sessionDir).toBeTruthy();
      expect(AGENT_PROFILES[agent].sessionPattern).toBeTruthy();
      expect(AGENT_PROFILES[agent].sessionHint).toBeTruthy();
    }
  });
});

describe('buildAgentArgs', () => {
  it('should build args for claude-code', () => {
    const profile = AGENT_PROFILES['claude-code'];
    const args = buildAgentArgs(profile, 'claude', 'test prompt');
    expect(Array.isArray(args)).toBe(true);
    expect(args.some(a => a.includes('test prompt') || a === 'test prompt')).toBe(true);
  });

  it('should build args for codex', () => {
    const profile = AGENT_PROFILES['codex'];
    const args = buildAgentArgs(profile, 'codex', 'test prompt');
    expect(Array.isArray(args)).toBe(true);
  });

  it('should handle empty prompt', () => {
    const profile = AGENT_PROFILES['claude-code'];
    const args = buildAgentArgs(profile, 'claude', '');
    expect(Array.isArray(args)).toBe(true);
  });
});

describe('shouldSpillPromptToFile', () => {
  it('returns true for win32 + .cmd shim when prompt is long', () => {
    const profile = AGENT_PROFILES['claude-code'];
    const long = 'x'.repeat(8000);
    expect(shouldSpillPromptToFile(profile, long, 'claude.cmd', 'win32')).toBe(true);
  });

  it('returns false on linux for moderately long flag prompts', () => {
    const profile = AGENT_PROFILES['claude-code'];
    const long = 'x'.repeat(8000);
    expect(shouldSpillPromptToFile(profile, long, 'claude', 'linux')).toBe(false);
  });
});

describe('vaultSchemaFilenameForAgent', () => {
  it('maps claude-code to CLAUDE.md', () => {
    expect(vaultSchemaFilenameForAgent('claude-code')).toBe('CLAUDE.md');
  });
  it('maps codex to AGENTS.md', () => {
    expect(vaultSchemaFilenameForAgent('codex')).toBe('AGENTS.md');
  });
  it('maps opencode to AGENTS.md (OpenCode official project rules file)', () => {
    expect(vaultSchemaFilenameForAgent('opencode')).toBe('AGENTS.md');
  });
  it('maps gemini-cli to GEMINI.md', () => {
    expect(vaultSchemaFilenameForAgent('gemini-cli')).toBe('GEMINI.md');
  });
  it('falls back to AGENTS.md for non-md context paths', () => {
    expect(vaultSchemaFilenameForAgent('cursor')).toBe('AGENTS.md');
  });
});

describe('prepareAgentPromptArgs', () => {
  it('returns inline prompt when spill is not needed', () => {
    const profile = AGENT_PROFILES['claude-code'];
    const p = prepareAgentPromptArgs(profile, 'claude', 'short', { taskSlug: 't' });
    expect(p.usedPromptFile).toBe(false);
    expect(p.args[p.args.length - 1]).toBe('short');
    p.cleanup();
  });

  it('writes a temp file when spill is required (win32 + cmd)', () => {
    const profile = AGENT_PROFILES['claude-code'];
    const body = 'y'.repeat(8000);
    const p = prepareAgentPromptArgs(profile, 'claude.cmd', body, { taskSlug: 't', platform: 'win32' });
    expect(p.usedPromptFile).toBe(true);
    const last = p.args[p.args.length - 1];
    expect(last.length).toBeLessThan(body.length);
    expect(last).toContain('Instruction file:');
    p.cleanup();
  });
});
