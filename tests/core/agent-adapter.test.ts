import { describe, it, expect } from 'vitest';
import { AGENT_PROFILES, buildAgentArgs } from '../../src/core/agent-adapter.js';

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

  it('should have sessionDir for key agents', () => {
    expect(AGENT_PROFILES['claude-code'].sessionDir).toBeTruthy();
    expect(AGENT_PROFILES['codex'].sessionDir).toBeTruthy();
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
