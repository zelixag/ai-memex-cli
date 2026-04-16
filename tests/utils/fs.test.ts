import { describe, it, expect } from 'vitest';
import { normalizePath, pathExists, listMarkdownFiles } from '../../src/utils/fs.js';
import { homedir } from 'node:os';
import { join } from 'node:path';

describe('normalizePath', () => {
  it('should return absolute path unchanged', () => {
    const result = normalizePath('/home/user/file.md');
    expect(result).toBe('/home/user/file.md');
  });

  it('should expand ~ to home directory', () => {
    const result = normalizePath('~/documents/file.md');
    expect(result).toBe(join(homedir(), 'documents/file.md'));
  });

  it('should handle empty string gracefully', () => {
    const result = normalizePath('');
    // Should resolve to cwd, not crash
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle Windows backslashes', () => {
    const result = normalizePath('some\\path\\file.md');
    expect(result).not.toContain('\\');
  });

  it('should handle tilde with backslash (Windows-style ~\\path)', () => {
    // Simulate: user types ~\.llmwiki\global on Windows
    const input = '~\\.llmwiki\\global';
    const result = normalizePath(input);
    expect(result).toContain(homedir().replace(/\\/g, '/'));
    expect(result).toContain('.llmwiki');
    expect(result).not.toContain('\\');
  });

  it('should resolve relative path against cwd', () => {
    const result = normalizePath('./subdir/file.md', '/base/dir');
    expect(result).toBe('/base/dir/subdir/file.md');
  });

  it('should handle just tilde', () => {
    const result = normalizePath('~');
    expect(result).toBe(homedir().replace(/\\/g, '/'));
  });

  it('should handle dot path', () => {
    const result = normalizePath('.', '/some/dir');
    expect(result).toBe('/some/dir');
  });
});

describe('pathExists', () => {
  it('should return true for existing path', async () => {
    expect(await pathExists('/')).toBe(true);
  });

  it('should return false for non-existing path', async () => {
    expect(await pathExists('/nonexistent-path-12345')).toBe(false);
  });

  it('should return false for empty string', async () => {
    expect(await pathExists('')).toBe(false);
  });
});

describe('listMarkdownFiles', () => {
  it('should return empty array for non-existing directory', async () => {
    const result = await listMarkdownFiles('/nonexistent-dir-12345');
    expect(result).toEqual([]);
  });
});
