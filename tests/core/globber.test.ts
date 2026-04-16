import { describe, it, expect } from 'vitest';
import { scorePages } from '../../src/core/globber.js';
import type { WikiPage } from '../../src/core/wiki-index.js';

describe('globber', () => {
  const pages: WikiPage[] = [
    { id: 'react-hooks', path: '/react-hooks.md', name: 'React Hooks', type: 'concept', scene: 'research', frontmatter: { tags: ['react', 'frontend'] }, outboundLinks: [] },
    { id: 'vue-composition', path: '/vue-composition.md', name: 'Vue Composition API', type: 'concept', scene: 'research', frontmatter: { tags: ['vue', 'frontend'] }, outboundLinks: [] },
    { id: 'rust-memory', path: '/rust-memory.md', name: 'Rust Memory Safety', type: 'concept', scene: 'research', frontmatter: { tags: ['rust', 'systems'] }, outboundLinks: [] },
  ];

  it('ranks pages by keyword relevance', () => {
    const result = scorePages(pages, ['react', 'frontend'], 10);
    expect(result[0].id).toBe('react-hooks');
  });

  it('respects max limit', () => {
    const result = scorePages(pages, ['frontend'], 1);
    expect(result.length).toBe(1);
  });

  it('returns empty for no matches', () => {
    const result = scorePages(pages, ['python'], 10);
    expect(result.length).toBe(0);
  });
});
