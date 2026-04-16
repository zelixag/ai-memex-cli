import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../src/core/schema.js';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter', () => {
    const content = `---
name: Test Page
type: entity
scene: research
tags: [react, hooks]
---
# Test Page
Content here.
`;
    const result = parseFrontmatter(content);
    expect(result.data.name).toBe('Test Page');
    expect(result.data.type).toBe('entity');
    expect(result.data.scene).toBe('research');
  });

  it('should handle empty string', () => {
    const result = parseFrontmatter('');
    expect(result).toBeDefined();
    // Should return empty or default object, not crash
  });

  it('should handle content without frontmatter', () => {
    const result = parseFrontmatter('# Just a heading\nSome content.');
    expect(result).toBeDefined();
  });

  it('should handle malformed frontmatter', () => {
    const content = `---
name: "unclosed string
---
# Content
`;
    // Should not throw
    expect(() => parseFrontmatter(content)).not.toThrow();
  });

  it('should handle frontmatter with no closing delimiter', () => {
    const content = `---
name: Test
# No closing delimiter
`;
    expect(() => parseFrontmatter(content)).not.toThrow();
  });
});
