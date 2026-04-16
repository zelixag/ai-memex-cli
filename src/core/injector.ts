import { resolve, dirname } from 'node:path';

/**
 * Parse @include directives from AGENTS.md content.
 * Format: ## @include <path>
 */
export function parseIncludes(content: string): string[] {
  const regex = /^##\s+@include\s+(.+)$/gm;
  const includes: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    includes.push(match[1].trim());
  }
  return includes;
}

/**
 * Resolve include paths relative to the vault directory.
 */
export function resolveIncludePaths(includes: string[], vaultDir: string): string[] {
  return includes.map(inc => {
    if (inc.startsWith('/') || inc.startsWith('~')) {
      return inc.replace('~', process.env.HOME || '');
    }
    return resolve(vaultDir, inc).replace(/\\/g, '/');
  });
}
