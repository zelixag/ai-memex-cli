import type { WikiPage } from './wiki-index.js';
import { validateFrontmatter } from './schema.js';

export interface BrokenLink {
  source: string;
  target: string;
}

export function findOrphans(pages: WikiPage[]): WikiPage[] {
  const inbound = new Set<string>();
  for (const page of pages) {
    for (const link of page.outboundLinks) {
      inbound.add(link);
    }
  }
  return pages.filter(p => !inbound.has(p.id));
}

export function findBrokenLinks(pages: WikiPage[]): BrokenLink[] {
  const allIds = new Set(pages.map(p => p.id));
  const broken: BrokenLink[] = [];
  for (const page of pages) {
    for (const link of page.outboundLinks) {
      if (!allIds.has(link)) {
        broken.push({ source: page.id, target: link });
      }
    }
  }
  return broken;
}

export function findMissingFrontmatter(pages: WikiPage[]): { page: WikiPage; errors: string[] }[] {
  return pages
    .map(p => ({ page: p, errors: validateFrontmatter(p.frontmatter) }))
    .filter(r => r.errors.length > 0);
}
