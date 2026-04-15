import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import fsExtra from 'fs-extra';
import { format } from 'date-fns';
import { glob } from 'glob';
import grayMatter from 'gray-matter';

const { ensureDirSync, writeJsonSync, readJsonSync } = fsExtra;

/**
 * Walk up the directory tree to find the nearest .memex directory
 */
export function findKbRoot(startDir) {
  let current = startDir;
  while (true) {
    const candidate = join(current, '.memex');
    if (existsSync(candidate)) return current;
    const parent = dirname(current);
    if (parent === current) return null; // reached filesystem root
    current = parent;
  }
}

/**
 * Get the structure of a knowledge base
 */
export function getKbStructure(kbPath) {
  return {
    root: kbPath,
    memexDir: join(kbPath, '.memex'),
    configFile: join(kbPath, '.memex', 'config.json'),
    wikiDir: join(kbPath, 'wiki'),
    sourcesDir: join(kbPath, 'sources'),
    indexFile: join(kbPath, 'wiki', 'index.md'),
    logFile: join(kbPath, 'wiki', 'log.md'),
    schemaFile: join(kbPath, 'AGENTS.md'),
  };
}

/**
 * Read the wiki index file
 */
export function readIndex(kbPath) {
  const { indexFile } = getKbStructure(kbPath);
  if (!existsSync(indexFile)) return '';
  return readFileSync(indexFile, 'utf8');
}

/**
 * Read the log file
 */
export function readLog(kbPath) {
  const { logFile } = getKbStructure(kbPath);
  if (!existsSync(logFile)) return '';
  return readFileSync(logFile, 'utf8');
}

/**
 * Append an entry to the log file
 */
export function appendLog(kbPath, type, title, details = '') {
  const { logFile } = getKbStructure(kbPath);
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
  const entry = `\n## [${timestamp}] ${type} | ${title}\n${details ? details + '\n' : ''}`;
  
  if (!existsSync(logFile)) {
    writeFileSync(logFile, `# Knowledge Base Log\n\nThis is an append-only record of all operations.\n${entry}`);
  } else {
    const existing = readFileSync(logFile, 'utf8');
    writeFileSync(logFile, existing + entry);
  }
}

/**
 * Update the index file with a new or updated page entry
 */
export function updateIndex(kbPath, pageName, summary, tags = []) {
  const { indexFile } = getKbStructure(kbPath);
  const date = format(new Date(), 'yyyy-MM-dd');
  const tagStr = tags.length ? ` \`${tags.join('` `')}\`` : '';
  const entry = `| [[${pageName}]] | ${summary} |${tagStr} | ${date} |`;

  if (!existsSync(indexFile)) {
    const header = `# Wiki Index\n\nA catalog of all pages in this knowledge base.\n\n| Page | Summary | Tags | Updated |\n|------|---------|------|--------|\n`;
    writeFileSync(indexFile, header + entry + '\n');
    return;
  }

  const content = readFileSync(indexFile, 'utf8');
  // Check if page already exists in index
  const pagePattern = new RegExp(`\\|\\s*\\[\\[${escapeRegex(pageName)}\\]\\].*\\n`, 'g');
  if (pagePattern.test(content)) {
    writeFileSync(indexFile, content.replace(pagePattern, entry + '\n'));
  } else {
    writeFileSync(indexFile, content + entry + '\n');
  }
}

/**
 * List all wiki pages with their frontmatter
 */
export async function listWikiPages(kbPath, options = {}) {
  const { wikiDir } = getKbStructure(kbPath);
  if (!existsSync(wikiDir)) return [];

  const files = await glob('**/*.md', { cwd: wikiDir, ignore: ['index.md', 'log.md'] });
  
  const pages = files.map(file => {
    const fullPath = join(wikiDir, file);
    const content = readFileSync(fullPath, 'utf8');
    const { data: frontmatter, content: body } = grayMatter(content);
    
    // Count inbound links
    const pageName = file.replace(/\.md$/, '');
    
    return {
      file,
      path: fullPath,
      name: pageName,
      title: frontmatter.title || pageName,
      tags: frontmatter.tags || [],
      summary: frontmatter.summary || extractFirstParagraph(body),
      updated: frontmatter.updated || null,
      sources: frontmatter.sources || [],
      wordCount: body.split(/\s+/).length,
    };
  });

  if (options.tag) {
    return pages.filter(p => p.tags.includes(options.tag));
  }

  return pages;
}

/**
 * Find orphan pages (pages with no inbound links from other wiki pages)
 */
export async function findOrphanPages(kbPath) {
  const pages = await listWikiPages(kbPath);
  const { wikiDir } = getKbStructure(kbPath);
  
  // Build a set of all page names
  const allPageNames = new Set(pages.map(p => p.name));
  
  // Find all links in all pages
  const linkedPages = new Set();
  for (const page of pages) {
    const content = readFileSync(page.path, 'utf8');
    const linkPattern = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      linkedPages.add(match[1]);
    }
  }

  return pages.filter(p => !linkedPages.has(p.name));
}

/**
 * Read a specific wiki page
 */
export function readWikiPage(kbPath, pageName) {
  const { wikiDir } = getKbStructure(kbPath);
  const filePath = join(wikiDir, `${pageName}.md`);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}

/**
 * Write a wiki page (creates or overwrites)
 */
export function writeWikiPage(kbPath, pageName, content) {
  const { wikiDir } = getKbStructure(kbPath);
  ensureDirSync(wikiDir);
  
  // Handle nested paths (e.g., "concepts/typescript")
  const filePath = join(wikiDir, `${pageName}.md`);
  ensureDirSync(dirname(filePath));
  writeFileSync(filePath, content);
}

/**
 * Read the AGENTS.md schema file
 */
export function readSchema(kbPath) {
  const { schemaFile } = getKbStructure(kbPath);
  if (!existsSync(schemaFile)) return '';
  return readFileSync(schemaFile, 'utf8');
}

/**
 * Search wiki pages for relevant content (simple keyword search)
 */
export async function searchWiki(kbPath, query, maxResults = 10) {
  const pages = await listWikiPages(kbPath);
  const keywords = query.toLowerCase().split(/\s+/);
  
  const scored = pages.map(page => {
    const content = (readFileSync(page.path, 'utf8') || '').toLowerCase();
    const score = keywords.reduce((acc, kw) => {
      const count = (content.match(new RegExp(kw, 'g')) || []).length;
      return acc + count;
    }, 0);
    return { ...page, score };
  });

  return scored
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Get KB config
 */
export function getKbConfig(kbPath) {
  const { configFile } = getKbStructure(kbPath);
  if (!existsSync(configFile)) return {};
  try {
    return readJsonSync(configFile);
  } catch {
    return {};
  }
}

/**
 * Save KB config
 */
export function saveKbConfig(kbPath, config) {
  const { configFile, memexDir } = getKbStructure(kbPath);
  ensureDirSync(memexDir);
  writeJsonSync(configFile, config, { spaces: 2 });
}

// --- Helpers ---

function extractFirstParagraph(text) {
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  return (lines[0] || '').slice(0, 120);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
