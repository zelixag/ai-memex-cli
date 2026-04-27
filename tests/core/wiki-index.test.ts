import { describe, it, expect } from 'vitest';
import { buildWikiIndex } from '../../src/core/wiki-index.js';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('buildWikiIndex', () => {
  it('indexes markdown files with frontmatter', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wiki-'));
    await mkdir(join(dir, 'research', 'concepts'), { recursive: true });
    await writeFile(
      join(dir, 'research', 'concepts', 'test-concept.md'),
      '---\nname: Test Concept\ndescription: A test\ntype: concept\nscene: research\n---\nBody here.'
    );
    const index = await buildWikiIndex(dir);
    expect(index.pages.length).toBe(1);
    expect(index.pages[0].name).toBe('Test Concept');
    expect(index.pages[0].type).toBe('concept');
  });

  it('detects outbound links', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wiki-'));
    await mkdir(join(dir, 'research', 'concepts'), { recursive: true });
    await writeFile(
      join(dir, 'research', 'concepts', 'linker.md'),
      '---\nname: Linker\ndescription: Links\ntype: concept\nscene: research\n---\nSee [[test-concept]].'
    );
    const index = await buildWikiIndex(dir);
    expect(index.pages[0].outboundLinks).toContain('test-concept');
  });

  it('handles empty directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wiki-empty-'));
    const index = await buildWikiIndex(dir);
    expect(index.pages.length).toBe(0);
  });

  it('ignores wiki links inside fenced code blocks', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wiki-'));
    await mkdir(join(dir, 'research', 'concepts'), { recursive: true });
    await writeFile(
      join(dir, 'research', 'concepts', 'with-code.md'),
      '---\nname: With Code\ndescription: Code block example\ntype: concept\nscene: research\n---\n```bash\nmemex link-check  # [[ref]] in code block\n```\nSee [[real-page]] for more.'
    );
    const index = await buildWikiIndex(dir);
    expect(index.pages[0].outboundLinks).toEqual(['real-page']);
  });

  it('ignores wiki links inside inline code', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wiki-'));
    await mkdir(join(dir, 'research', 'concepts'), { recursive: true });
    await writeFile(
      join(dir, 'research', 'concepts', 'inline-code.md'),
      '---\nname: Inline\ndescription: Inline code example\ntype: concept\nscene: research\n---\nUse `[[fake]]` as placeholder syntax. Check [[actual-link]].'
    );
    const index = await buildWikiIndex(dir);
    expect(index.pages[0].outboundLinks).toEqual(['actual-link']);
  });
});
