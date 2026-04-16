import { describe, it, expect } from 'vitest';
import { findOrphans, findBrokenLinks } from '../../src/core/linker.js';
import type { WikiPage } from '../../src/core/wiki-index.js';

describe('linker', () => {
  const pages: WikiPage[] = [
    { id: 'a', path: '/a.md', name: 'A', type: 'concept', scene: 'research', frontmatter: {}, outboundLinks: ['b', 'c'] },
    { id: 'b', path: '/b.md', name: 'B', type: 'concept', scene: 'research', frontmatter: {}, outboundLinks: ['a'] },
    { id: 'orphan', path: '/orphan.md', name: 'Orphan', type: 'concept', scene: 'research', frontmatter: {}, outboundLinks: [] },
  ];

  it('finds orphan pages', () => {
    const orphans = findOrphans(pages);
    expect(orphans.map(o => o.id)).toEqual(['orphan']);
  });

  it('finds broken links', () => {
    const broken = findBrokenLinks(pages);
    expect(broken).toEqual([{ source: 'a', target: 'c' }]);
  });
});
