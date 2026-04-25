#!/usr/bin/env node
// Phase 1: Preflight checks. Read-only — never writes anything.
//
// Verifies: in git repo, on expected branch, working tree status, node ≥ 20,
// pnpm/claude/gh availability, npm login state.
//
// Flags:
//   --branch <name>   Expected current branch (default: main)
//   --no-claude       Skip claude availability check (used with --manual-docs upstream)
//   --no-npm-auth     Skip `pnpm whoami` (used in dry-run mode upstream)
//
// Exit code: 0 if all hard requirements met (warnings are non-fatal).

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { sh, shOut, hasBin, resolvePnpmEntry } from "./_shared/shell.mjs";
import { readPkg } from "./_shared/pkg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { branch: "main", noClaude: false, noNpmAuth: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--branch") args.branch = argv[++i];
    else if (a === "--no-claude") args.noClaude = true;
    else if (a === "--no-npm-auth") args.noNpmAuth = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: 01-preflight.mjs [--branch <name>] [--no-claude] [--no-npm-auth]\n",
      );
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

step("1/11", "Preflight");

// pnpm
if (!hasBin("pnpm")) die("pnpm is not in PATH");
const pnpmEntry = resolvePnpmEntry();
if (pnpmEntry) ok(`pnpm available (Windows shim bypass: node "${pnpmEntry}")`);
else if (process.platform === "win32")
  warn("pnpm available, but cmd-shim bypass failed — may trip libuv assertion on Windows");
else ok("pnpm available");

// git repo
const inRepo = shOut("git", ["rev-parse", "--is-inside-work-tree"]).stdout === "true";
if (!inRepo) die("Not inside a git repository");
ok("inside a git repository");

// branch
const currentBranch = shOut("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout;
if (currentBranch !== args.branch)
  warn(`Current branch is "${currentBranch}", expected "${args.branch}"`);
else ok(`on branch ${currentBranch}`);

// working tree
const status = shOut("git", ["status", "--porcelain"]).stdout;
const dirty = Boolean(status);
if (dirty) {
  warn("Working tree has uncommitted changes:");
  for (const line of status.split("\n")) info(`    ${line}`);
  warn("(these will be folded into the release commit later)");
} else {
  ok("working tree clean");
}

// node version
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 20) die(`Node ${process.version} is too old; need >= 20`);
ok(`node ${process.version}`);

// claude binary
const claudeAvailable = hasBin("claude");
if (args.noClaude) {
  info("claude check skipped (--no-claude)");
} else if (claudeAvailable) {
  ok("claude (Claude Code) available");
} else {
  warn("claude not found in PATH — re-run with --manual-docs to skip agent doc-sync");
}

// gh binary
const ghAvailable = hasBin("gh");
if (ghAvailable) {
  const auth = shOut("gh", ["auth", "status"]);
  if (auth.code === 0) ok("gh authenticated");
  else warn("gh installed but not authenticated — `gh auth login` before stable release");
} else {
  warn("gh CLI not installed — GitHub Release creation will fail (skip via --beta or fix later)");
}

// npm auth
let npmUser = null;
if (args.noNpmAuth) {
  info("npm auth check skipped");
} else {
  const who = shOut("pnpm", ["whoami"]);
  if (who.code === 0 && who.stdout) {
    npmUser = who.stdout;
    ok(`npm user: ${npmUser}`);
  } else {
    warn("`pnpm whoami` failed — run `pnpm login` before publish");
  }
}

// version + tag info
const { data: pkg } = readPkg(repoRoot);
const lastTag = shOut("git", ["describe", "--tags", "--abbrev=0"]).stdout || null;
const logRange = lastTag ? `${lastTag}..HEAD` : "HEAD";
const commitsRaw = shOut("git", ["rev-list", "--count", logRange]).stdout;
const commitsSinceLastTag = Number(commitsRaw) || 0;

info(`current version: ${pkg.version}`);
info(`last tag: ${lastTag ?? "(none)"}`);
info(`commits since last tag: ${commitsSinceLastTag}`);

emitSummary({
  ok: true,
  currentVersion: pkg.version,
  currentBranch,
  expectedBranch: args.branch,
  branchMatch: currentBranch === args.branch,
  dirty,
  lastTag,
  commitsSinceLastTag,
  claudeAvailable,
  ghAvailable,
  npmUser,
});
