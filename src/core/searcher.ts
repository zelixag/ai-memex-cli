/**
 * searcher.ts
 *
 * Web search engine for `memex fetch` keyword mode.
 * Uses DuckDuckGo Lite (no API key required) to find relevant URLs
 * from a natural language query.
 *
 * Flow:
 *   1. User types: `memex fetch "react hooks best practices"`
 *   2. CLI detects it's not a URL → enters search mode
 *   3. Queries DuckDuckGo Lite HTML → parses result links
 *   4. Presents top results for user to confirm (or auto-fetch with --yes)
 *   5. Fetches selected URLs into raw/
 */

import { request } from 'undici';
import { JSDOM } from 'jsdom';

export interface SearchResult {
  /** Result title */
  title: string;
  /** Result URL */
  url: string;
  /** Short snippet / description */
  snippet: string;
}

const SEARCH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Search DuckDuckGo Lite for a query and return top results.
 * DuckDuckGo Lite returns a simple HTML page that's easy to parse.
 */
export async function webSearch(
  query: string,
  maxResults: number = 8
): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query);
  const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encoded}`;

  const { body, statusCode } = await request(searchUrl, {
    method: 'POST',
    headers: {
      'User-Agent': SEARCH_UA,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `q=${encoded}`,
    bodyTimeout: 15_000,
    headersTimeout: 15_000,
  });

  if (statusCode >= 400) {
    throw new Error(`Search failed with HTTP ${statusCode}`);
  }

  const html = await body.text();
  return parseDuckDuckGoLite(html, maxResults);
}

/**
 * Parse DuckDuckGo Lite HTML results page.
 * The Lite version uses a simple table-based layout.
 */
function parseDuckDuckGoLite(html: string, maxResults: number): SearchResult[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const results: SearchResult[] = [];

  // DuckDuckGo Lite uses <a class="result-link"> or table rows with links
  // Strategy 1: Look for result links
  const links = doc.querySelectorAll('a.result-link');
  if (links.length > 0) {
    links.forEach((a) => {
      if (results.length >= maxResults) return;
      const url = (a as HTMLAnchorElement).href;
      const title = a.textContent?.trim() ?? '';
      if (url && title && url.startsWith('http')) {
        // Try to find the snippet in the next sibling row
        const snippet = findSnippetNear(a) ?? '';
        results.push({ title, url, snippet });
      }
    });
  }

  // Strategy 2: Parse table rows (DuckDuckGo Lite format)
  if (results.length === 0) {
    const rows = doc.querySelectorAll('table tr');
    let currentTitle = '';
    let currentUrl = '';

    rows.forEach((row) => {
      if (results.length >= maxResults) return;

      // Title/link row
      const link = row.querySelector('a');
      if (link) {
        const href = (link as HTMLAnchorElement).href;
        const text = link.textContent?.trim() ?? '';
        if (href && href.startsWith('http') && text && !text.includes('duckduckgo')) {
          if (currentUrl && currentTitle) {
            results.push({ title: currentTitle, url: currentUrl, snippet: '' });
          }
          currentTitle = text;
          currentUrl = href;
        }
      }

      // Snippet row (class="result-snippet" or just td with text)
      const snippet = row.querySelector('.result-snippet, td.result-snippet');
      if (snippet && currentUrl) {
        const snipText = snippet.textContent?.trim() ?? '';
        if (snipText) {
          results.push({ title: currentTitle, url: currentUrl, snippet: snipText });
          currentTitle = '';
          currentUrl = '';
        }
      }
    });

    // Push last result if pending
    if (currentUrl && currentTitle && results.length < maxResults) {
      results.push({ title: currentTitle, url: currentUrl, snippet: '' });
    }
  }

  // Strategy 3: Fallback — find all external links
  if (results.length === 0) {
    const allLinks = doc.querySelectorAll('a[href]');
    allLinks.forEach((a) => {
      if (results.length >= maxResults) return;
      const href = (a as HTMLAnchorElement).href;
      const text = a.textContent?.trim() ?? '';
      if (
        href &&
        text &&
        href.startsWith('http') &&
        !href.includes('duckduckgo.com') &&
        !href.includes('duck.co') &&
        text.length > 10
      ) {
        results.push({ title: text, url: href, snippet: '' });
      }
    });
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return results.filter((r) => {
    const norm = r.url.split('#')[0].replace(/\/$/, '');
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

function findSnippetNear(element: Element): string | null {
  // Walk up to the parent row/cell and look for snippet text
  let parent = element.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    const snippet = parent.querySelector('.result-snippet');
    if (snippet) return snippet.textContent?.trim() ?? null;
    // Check next sibling
    const next = parent.nextElementSibling;
    if (next) {
      const snip = next.querySelector('.result-snippet') ?? next;
      const text = snip.textContent?.trim() ?? '';
      if (text && text.length > 20 && !text.includes('http')) return text;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Check if a string looks like a URL.
 */
export function isUrl(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  // Obvious URL patterns
  if (/^https?:\/\//i.test(trimmed)) return true;
  // Domain-like patterns: something.tld/...
  if (/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(\/|$)/.test(trimmed)) return true;
  return false;
}

/**
 * Normalize a potential URL (add https:// if missing).
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
