import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename, extname } from 'path';
import fetch from 'node-fetch';
import TurndownService from 'turndown';
import fsExtra from 'fs-extra';
import { format } from 'date-fns';
import slugify from 'slugify';

const { ensureDirSync } = fsExtra;
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

/**
 * Fetch content from a source (file path, URL, or raw text)
 * Returns { content, title, type, savedPath }
 */
export async function fetchSource(source, sourcesDir) {
  ensureDirSync(sourcesDir);

  // URL
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return await fetchUrl(source, sourcesDir);
  }

  // File path
  if (existsSync(source)) {
    return fetchFile(source, sourcesDir);
  }

  // Raw text (treat as inline note)
  return {
    content: source,
    title: 'Inline Note',
    type: 'text',
    savedPath: null,
  };
}

async function fetchUrl(url, sourcesDir) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; memex-cli/0.1; +https://github.com/memex-cli)',
    },
    timeout: 15000,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  let content, title;

  if (contentType.includes('text/html')) {
    const html = await response.text();
    content = turndown.turndown(html);
    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
  } else if (contentType.includes('application/json')) {
    const json = await response.json();
    content = JSON.stringify(json, null, 2);
    title = new URL(url).pathname.split('/').pop() || 'JSON Source';
  } else {
    content = await response.text();
    title = new URL(url).pathname.split('/').pop() || 'Web Source';
  }

  // Save to sources directory
  const slug = slugify(title, { lower: true, strict: true }).slice(0, 60);
  const date = format(new Date(), 'yyyyMMdd');
  const fileName = `${date}-${slug}.md`;
  const savedPath = join(sourcesDir, fileName);
  
  const frontmatter = `---\ntitle: "${title}"\nurl: "${url}"\nfetched: "${format(new Date(), 'yyyy-MM-dd')}"\n---\n\n`;
  writeFileSync(savedPath, frontmatter + content);

  return { content, title, type: 'url', savedPath, url };
}

function fetchFile(filePath, sourcesDir) {
  const ext = extname(filePath).toLowerCase();
  const fileName = basename(filePath);
  let content;

  if (['.md', '.txt', '.rst', '.text'].includes(ext)) {
    content = readFileSync(filePath, 'utf8');
  } else if (ext === '.json') {
    const raw = readFileSync(filePath, 'utf8');
    content = '```json\n' + raw + '\n```';
  } else if (['.js', '.ts', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.sh'].includes(ext)) {
    const raw = readFileSync(filePath, 'utf8');
    content = `\`\`\`${ext.slice(1)}\n${raw}\n\`\`\``;
  } else {
    // Try to read as text
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      throw new Error(`Cannot read file: ${filePath}. Unsupported format.`);
    }
  }

  // Copy to sources directory if not already there
  const destPath = join(sourcesDir, fileName);
  if (filePath !== destPath && !existsSync(destPath)) {
    writeFileSync(destPath, readFileSync(filePath));
  }

  // Extract title from frontmatter or filename
  const frontmatterMatch = content.match(/^---\n[\s\S]*?title:\s*["']?([^"'\n]+)["']?/m);
  const title = frontmatterMatch ? frontmatterMatch[1] : fileName.replace(/\.[^.]+$/, '');

  return { content, title, type: 'file', savedPath: destPath, filePath };
}
