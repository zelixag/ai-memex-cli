/**
 * fetcher.ts
 *
 * Core web scraping engine for `memex fetch`.
 * Supports single URLs, sitemaps, and recursive crawling.
 * Converts HTML → clean Markdown using Readability + Turndown.
 */

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { request } from 'undici';

export interface FetchResult {
  url: string;
  title: string;
  content: string;   // Markdown
  rawHtml: string;
  fetchedAt: string;
  wordCount: number;
}

export interface FetchOptions {
  /** Follow links up to this depth (0 = single page) */
  depth?: number;
  /** Max pages to fetch in recursive mode */
  maxPages?: number;
  /** Only follow links matching this pattern */
  include?: string;
  /** Skip links matching this pattern */
  exclude?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** User-Agent string */
  userAgent?: string;
  /** Whether to strip nav/header/footer before Readability */
  aggressive?: boolean;
}

const DEFAULT_UA =
  'Mozilla/5.0 (compatible; memex-cli/0.1; +https://github.com/zelixag/ai-memex-cli)';

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Keep code blocks and tables
td.addRule('fencedCodeBlock', {
  filter: ['pre'],
  replacement: (_content: string, node: Node) => {
    const code = (node as Element).querySelector('code');
    const lang = code?.className?.replace('language-', '') ?? '';
    const text = code?.textContent ?? (node as Element).textContent ?? '';
    return `\n\`\`\`${lang}\n${text.trim()}\n\`\`\`\n`;
  },
});

/**
 * Fetch a single URL and return clean Markdown.
 */
export async function fetchUrl(
  url: string,
  opts: FetchOptions = {}
): Promise<FetchResult> {
  const timeout = opts.timeout ?? 15_000;
  const ua = opts.userAgent ?? DEFAULT_UA;

  const { body, statusCode } = await request(url, {
    headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml' },
    bodyTimeout: timeout,
    headersTimeout: timeout,
  });

  if (statusCode >= 400) {
    throw new Error(`HTTP ${statusCode} for ${url}`);
  }

  const rawHtml = await body.text();
  const dom = new JSDOM(rawHtml, { url });

  if (opts.aggressive) {
    // Remove nav, header, footer, aside, ads
    for (const sel of ['nav', 'header', 'footer', 'aside', '.ad', '#sidebar', '.sidebar']) {
      dom.window.document.querySelectorAll(sel).forEach((el: Element) => el.remove());
    }
  }

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const title = article?.title ?? dom.window.document.title ?? url;
  const htmlContent = article?.content ?? dom.window.document.body?.innerHTML ?? '';
  const content = td.turndown(htmlContent);

  return {
    url,
    title,
    content,
    rawHtml,
    fetchedAt: new Date().toISOString(),
    wordCount: content.split(/\s+/).length,
  };
}

/**
 * Recursively crawl a site starting from a URL.
 * Returns all fetched results up to maxPages.
 */
export async function crawlSite(
  startUrl: string,
  opts: FetchOptions = {}
): Promise<FetchResult[]> {
  const depth = opts.depth ?? 1;
  const maxPages = opts.maxPages ?? 20;
  const includePattern = opts.include ? new RegExp(opts.include) : null;
  const excludePattern = opts.exclude ? new RegExp(opts.exclude) : null;

  const visited = new Set<string>();
  const queue: Array<{ url: string; level: number }> = [{ url: startUrl, level: 0 }];
  const results: FetchResult[] = [];

  const baseOrigin = new URL(startUrl).origin;

  while (queue.length > 0 && results.length < maxPages) {
    const { url, level } = queue.shift()!;
    const normalized = url.split('#')[0]; // strip fragments
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    try {
      const result = await fetchUrl(url, opts);
      results.push(result);

      // Discover links if we haven't hit max depth
      if (level < depth) {
        const dom = new JSDOM(result.rawHtml, { url });
        const links = Array.from(dom.window.document.querySelectorAll('a[href]'))
          .map((a: Element) => {
            try {
              return new URL((a as HTMLAnchorElement).href, url).href;
            } catch {
              return null;
            }
          })
          .filter((href): href is string => {
            if (!href) return false;
            if (!href.startsWith(baseOrigin)) return false; // same-origin only
            if (includePattern && !includePattern.test(href)) return false;
            if (excludePattern && excludePattern.test(href)) return false;
            const norm = href.split('#')[0];
            return !visited.has(norm);
          });

        for (const link of links) {
          queue.push({ url: link, level: level + 1 });
        }
      }
    } catch (e) {
      // Skip failed URLs silently in crawl mode
    }
  }

  return results;
}

/**
 * Parse a sitemap XML and return all page URLs.
 */
export async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  const { body, statusCode } = await request(sitemapUrl, {
    headers: { 'User-Agent': DEFAULT_UA },
    bodyTimeout: 15_000,
    headersTimeout: 15_000,
  });

  if (statusCode >= 400) {
    throw new Error(`HTTP ${statusCode} fetching sitemap`);
  }

  const xml = await body.text();
  const urls: string[] = [];

  // Handle sitemap index (nested sitemaps)
  const sitemapMatches = xml.matchAll(/<sitemap>[\s\S]*?<loc>(.*?)<\/loc>/g);
  for (const m of sitemapMatches) {
    const nested = await parseSitemap(m[1].trim());
    urls.push(...nested);
  }

  // Handle regular sitemap
  const urlMatches = xml.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>/g);
  for (const m of urlMatches) {
    urls.push(m[1].trim());
  }

  return urls;
}

/**
 * Convert a FetchResult to a raw Markdown file with frontmatter.
 */
export function resultToMarkdown(result: FetchResult): string {
  const safeTitle = result.title.replace(/"/g, '\\"');
  return `---
title: "${safeTitle}"
source-url: ${result.url}
fetched: ${result.fetchedAt}
word-count: ${result.wordCount}
---

# ${result.title}

> Source: [${result.url}](${result.url})
> Fetched: ${result.fetchedAt}

${result.content}
`;
}

/**
 * Slugify a title or URL into a safe filename.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/https?:\/\/[^/]+\/?/, '') // strip protocol+domain
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'fetched-page';
}
