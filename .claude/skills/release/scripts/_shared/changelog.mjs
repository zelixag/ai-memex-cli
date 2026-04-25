// Slice a single version's section out of CHANGELOG.md.
// Used to feed `gh release create --notes-file`.

import { readFileSync } from "node:fs";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Read CHANGELOG.md and return the body of `## v<version>` (everything until
 * the next `## v...` heading or EOF). Heading line itself is excluded.
 *
 * Returns null if the section isn't found.
 */
export function readChangelogSection(changelogPath, version) {
  const content = readFileSync(changelogPath, "utf8");
  const headingRe = new RegExp(`^## v${escapeRegex(version)}\\s*$`, "m");
  const match = headingRe.exec(content);
  if (!match) return null;

  const start = match.index + match[0].length;
  const tail = content.slice(start);
  const nextRe = /^## v[^\n]*$/m;
  const nextMatch = nextRe.exec(tail);
  const body = nextMatch ? tail.slice(0, nextMatch.index) : tail;
  return body.trim();
}

/** Whether the changelog has a section for this version. */
export function hasChangelogSection(changelogPath, version) {
  return readChangelogSection(changelogPath, version) !== null;
}
