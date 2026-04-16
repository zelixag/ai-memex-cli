import { describe, it, expect } from 'vitest';
import { parseIncludes, resolveIncludePaths } from '../../src/core/injector.js';

describe('injector', () => {
  it('parses @include directives', () => {
    const content = `# Schema

## @include ../global/wiki/frontend.md
## @include ./wiki/*.md
## @include /absolute/path.md

Some other content.
`;
    const includes = parseIncludes(content);
    expect(includes).toEqual([
      '../global/wiki/frontend.md',
      './wiki/*.md',
      '/absolute/path.md',
    ]);
  });

  it('resolves relative paths', () => {
    const includes = ['./wiki/test.md', '../global/wiki/page.md'];
    const resolved = resolveIncludePaths(includes, '/home/user/.llmwiki/local');
    expect(resolved[0]).toContain('wiki/test.md');
    expect(resolved[1]).toContain('global/wiki/page.md');
  });

  it('preserves absolute paths', () => {
    const includes = ['/absolute/path.md'];
    const resolved = resolveIncludePaths(includes, '/home/user/.llmwiki/local');
    expect(resolved[0]).toBe('/absolute/path.md');
  });
});
