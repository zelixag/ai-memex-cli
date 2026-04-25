#!/usr/bin/env node
// Phase 7: git add + commit + tag (local only, no push).
//
// Flags:
//   --version <X.Y.Z>   Required (used for commit message and tag name)
//   --dry-run           Print intended commands but don't run them

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { sh, shOut } from "./_shared/shell.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { version: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--version") args.version = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write("Usage: 07-git-finalize.mjs --version <X.Y.Z> [--dry-run]\n");
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  if (!args.version) die("--version is required");
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

const tag = `v${args.version}`;
const commitMsg = `release: ${tag}`;

step("7/11", `Git commit & tag (${tag})`);

if (args.dryRun) {
  info(`[dry-run] would: git add -A && git commit -m "${commitMsg}" && git tag ${tag}`);
  emitSummary({ ok: true, committed: false, tagged: false, tag, dryRun: true });
  process.exit(0);
}

// Refuse if tag already exists locally.
const existing = shOut("git", ["tag", "--list", tag]).stdout;
if (existing) {
  die(`tag ${tag} already exists locally — delete with \`git tag -d ${tag}\` if you really want to redo`);
}

sh("git", ["add", "-A"]);
const stagedDiff = shOut("git", ["diff", "--cached", "--quiet"]);
const hasStaged = stagedDiff.code !== 0;

let committed = false;
let sha = null;
if (hasStaged) {
  sh("git", ["commit", "-m", commitMsg]);
  sha = shOut("git", ["rev-parse", "HEAD"]).stdout;
  committed = true;
  ok(`committed: ${commitMsg} (${sha.slice(0, 7)})`);
} else {
  warn("no staged changes — skipping commit, will tag existing HEAD");
  sha = shOut("git", ["rev-parse", "HEAD"]).stdout;
}

sh("git", ["tag", tag]);
ok(`tagged ${tag} → ${sha.slice(0, 7)}`);

emitSummary({ ok: true, committed, tagged: true, tag, sha, dryRun: false });
