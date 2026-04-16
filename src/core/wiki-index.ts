import { listMarkdownFiles, readFileUtf8 } from '../utils/fs.js';
import { parseFrontmatter, type Frontmatter } from './schema.js';
import { basename } from 'node:path';

export interface WikiPage {
  id: string;
  path: string;
  name: string;
  type: string;
  scene: string;
  frontmatter: Partial<Frontmatter>;
  outboundLinks: string[];
}

export interface WikiIndex {
  pages: WikiPage[];
}

export async function buildWikiIndex(wikiDir: string): Promise<WikiIndex> {
  const files = await listMarkdownFiles(wikiDir);
  const pages: WikiPage[] = [];

  for (const filePath of files) {
    const content = await readFileUtf8(filePath);
    const { data, body } = parseFrontmatter(content);
    const id = basename(filePath, '.md');
    const links = extractWikiLinks(body);
    pages.push({
      id,
      path: filePath,
      name: data.name || id,
      type: data.type || 'unknown',
      scene: data.scene || 'unknown',
      frontmatter: data,
      outboundLinks: links,
    });
  }

  return { pages };
}

export function extractWikiLinks(body: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}
