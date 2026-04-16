import { describe, it, expect } from 'vitest';
import { configCommand } from '../../src/commands/config.js';
import { captureOutput } from '../helpers.js';

describe('configCommand', () => {
  const cwd = process.cwd();

  it('should list supported agents', async () => {
    const { stdout, stderr } = await captureOutput(async () => {
      await configCommand({ subcommand: 'agents' }, cwd);
    });
    const output = stdout + stderr;
    expect(output).toContain('claude-code');
    expect(output).toContain('codex');
  });

  it('should handle empty subcommand gracefully', async () => {
    const { stdout, stderr } = await captureOutput(async () => {
      await configCommand({ subcommand: '' as any }, cwd);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/usage|list|set|get|agents/i);
  });

  it('should handle invalid subcommand gracefully', async () => {
    const { stdout, stderr } = await captureOutput(async () => {
      await configCommand({ subcommand: 'nonexistent' as any }, cwd);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/unknown|invalid|usage/i);
  });

  it('should handle set without key gracefully', async () => {
    const { stdout, stderr } = await captureOutput(async () => {
      await configCommand({ subcommand: 'set' }, cwd);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/usage|key|value/i);
  });

  it('should handle set without value gracefully', async () => {
    const { stdout, stderr } = await captureOutput(async () => {
      await configCommand({ subcommand: 'set', key: 'agent' }, cwd);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/usage|value/i);
  });

  it('should handle get without key gracefully', async () => {
    const { stdout, stderr } = await captureOutput(async () => {
      await configCommand({ subcommand: 'get' }, cwd);
    });
    const output = stdout + stderr;
    expect(output).toMatch(/usage|key/i);
  });
});
