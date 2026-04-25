#!/usr/bin/env node
// Phase 6: `pnpm pack --dry-run` preview + content audit.
//
// Catches two failure modes:
//   - missing files (e.g. dist/ not built, README.zh-CN.md not in `files`)
//   - unexpected files (e.g. .claude/, .codex/, website/, tests/ leaked)
//
// Reads `files` field from package.json as the source of truth.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { shOut, shPnpm } from "./_shared/shell.mjs";
import { readPkg } from "./_shared/pkg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

// Patterns that should NEVER end up in the published tarball, regardless of
// what package.json says. If any of these match, we abort.
const FORBIDDEN_PATTERNS = [
  /^\.claude\//,
  /^\.codex\//,
  /^\.llmwiki\//,
  /^website\//,
  /^tests\//,
  /^scripts\//,
  /^docs\//,
  /^node_modules\//,
  /\.test\.(?:t|j)s$/,
  /^\.env/,
];

// Files we absolutely expect to find in the tarball.
const REQUIRED_FILES = [
  "package.json",
  "README.md",
  "README.zh-CN.md",
  "CHANGELOG.md",
  "LICENSE",
  "dist/cli.js",
];

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write("Usage: 06-pack-preview.mjs\n");
  process.exit(0);
}

process.chdir(repoRoot);
step("6/11", "Pack preview");

const { data: pkg } = readPkg(repoRoot);
info(`pnpm pack --dry-run for ${pkg.name}@${pkg.version}`);

// `pnpm pack --dry-run --json` outputs a JSON manifest with the file list.
// Fall back to plain stderr parsing if --json isn't supported.
const json = shOut("pnpm", ["pack", "--dry-run", "--json"], { cwd: repoRoot });
let entries = [];
let totalBytes = 0;
let unpackedBytes = 0;

if (json.code === 0 && json.stdout) {
  try {
    // pnpm pack --json prints an array
    const arr = JSON.parse(json.stdout);
    const item = Array.isArray(arr) ? arr[0] : arr;
    entries = (item.files || []).map((f) => f.path);
    totalBytes = item.size || 0;
    unpackedBytes = item.unpackedSize || 0;
  } catch (e) {
    warn(`failed to parse pnpm pack --json output: ${e.message}`);
  }
}

if (entries.length === 0) {
  // Fallback: parse non-JSON stderr ("npm notice <bytes> <path>")
  const plain = shOut("pnpm", ["pack", "--dry-run"], { cwd: repoRoot });
  const lines = (plain.stderr || plain.stdout).split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*(?:npm |pnpm )?notice\s+\d+(?:\.\d+)?\s*[KMG]?B\s+(.+)$/);
    if (m) entries.push(m[1].trim());
  }
}

if (entries.length === 0) {
  die("could not determine tarball contents — pack-preview aborted");
}

// Audit
const missing = REQUIRED_FILES.filter((f) => !entries.includes(f));
const unexpected = entries.filter((f) =>
  FORBIDDEN_PATTERNS.some((re) => re.test(f)),
);

info(`${entries.length} files, ${formatBytes(totalBytes)} packed / ${formatBytes(unpackedBytes)} unpacked`);
for (const f of entries.slice(0, 20)) info(`    ${f}`);
if (entries.length > 20) info(`    ... and ${entries.length - 20} more`);

if (missing.length) {
  for (const f of missing) warn(`MISSING required file: ${f}`);
}
if (unexpected.length) {
  for (const f of unexpected) warn(`UNEXPECTED file leaked: ${f}`);
}

if (missing.length || unexpected.length) {
  die(
    `pack-preview failed: ${missing.length} missing, ${unexpected.length} unexpected — fix package.json "files" before continuing`,
  );
}

ok("tarball contents look right");
emitSummary({
  ok: true,
  fileCount: entries.length,
  totalBytes,
  unpackedBytes,
  files: entries,
});

function formatBytes(n) {
  if (!n) return "0B";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}
