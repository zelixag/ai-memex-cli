import type { WikiPage } from './wiki-index.js';
import { readFileUtf8, pathExists } from '../utils/fs.js';
import { join } from 'node:path';

export interface ScoredPage {
  page: WikiPage;
  score: number;
  id: string;
}

export function scorePages(pages: WikiPage[], keywords: string[], max: number): ScoredPage[] {
  const scored = pages.map(page => {
    let score = 0;
    const tags = page.frontmatter.tags || [];
    const text = `${page.name} ${page.id} ${tags.join(' ')} ${page.frontmatter.description || ''}`.toLowerCase();

    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (page.id === k) score += 10;
      else if (page.name.toLowerCase() === k) score += 8;
      else if (tags.some(t => t.toLowerCase() === k)) score += 5;
      else if (text.includes(k)) score += 2;
    }

    return { page, score, id: page.id };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

/**
 * Extract keywords from a project directory by reading package.json and README.md.
 */
export async function extractKeywords(projectDir: string): Promise<string[]> {
  const keywords: Set<string> = new Set();

  // Try package.json
  const pkgPath = join(projectDir, 'package.json');
  if (await pathExists(pkgPath)) {
    try {
      const raw = await readFileUtf8(pkgPath);
      const pkg = JSON.parse(raw);
      if (pkg.name) keywords.add(pkg.name.replace(/^@[^/]+\//, ''));
      if (pkg.keywords) {
        for (const kw of pkg.keywords) keywords.add(kw);
      }
      // Extract from dependencies
      for (const deps of [pkg.dependencies, pkg.devDependencies]) {
        if (deps) {
          for (const dep of Object.keys(deps)) {
            const name = dep.replace(/^@[^/]+\//, '');
            if (name.length > 2) keywords.add(name);
          }
        }
      }
    } catch { /* ignore parse errors */ }
  }

  // Try README.md — extract first heading and bold terms
  const readmePath = join(projectDir, 'README.md');
  if (await pathExists(readmePath)) {
    try {
      const content = await readFileUtf8(readmePath);
      const headingMatch = content.match(/^#\s+(.+)/m);
      if (headingMatch) {
        for (const word of headingMatch[1].split(/\s+/)) {
          if (word.length > 2) keywords.add(word.toLowerCase().replace(/[^a-z0-9-]/g, ''));
        }
      }
      // Extract bold terms
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let match: RegExpExecArray | null;
      while ((match = boldRegex.exec(content)) !== null) {
        const term = match[1].toLowerCase().trim();
        if (term.length > 2 && term.length < 30) keywords.add(term);
      }
    } catch { /* ignore */ }
  }

  // Try project AGENTS.md
  const agentsPath = join(projectDir, '.llmwiki', 'local', 'AGENTS.md');
  if (await pathExists(agentsPath)) {
    try {
      const content = await readFileUtf8(agentsPath);
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let match: RegExpExecArray | null;
      while ((match = boldRegex.exec(content)) !== null) {
        const term = match[1].toLowerCase().trim();
        if (term.length > 2 && term.length < 30) keywords.add(term);
      }
    } catch { /* ignore */ }
  }

  keywords.delete('');
  return [...keywords];
}
