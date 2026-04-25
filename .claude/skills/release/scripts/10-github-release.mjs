#!/usr/bin/env node
// Phase 10: Create GitHub Release with notes sliced from CHANGELOG.md.
//
// Skipped automatically by the orchestrator for beta releases. If invoked
// directly with --prerelease, the release is marked as a prerelease on GitHub.
//
// Flags:
//   --version <X.Y.Z>   Required (tag = vX.Y.Z, also used for changelog slice)
//   --prerelease        Pass --prerelease to gh (mark as prerelease)
//   --dry-run           Skip the gh call, but still validate the notes slice

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { hasBin, sh, shOut } from "./_shared/shell.mjs";
import { readChangelogSection } from "./_shared/changelog.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { version: null, prerelease: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--version") args.version = argv[++i];
    else if (a === "--prerelease") args.prerelease = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: 10-github-release.mjs --version <X.Y.Z> [--prerelease] [--dry-run]\n",
      );
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  if (!args.version) die("--version is required");
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

const tag = `v${args.version}`;
step("10/11", `GitHub Release (${tag})`);

if (!hasBin("gh")) die("gh CLI not installed — install or skip this phase");

const changelogPath = join(repoRoot, "CHANGELOG.md");
const notes = readChangelogSection(changelogPath, args.version);
if (!notes) {
  if (args.dryRun) {
    warn(`no \`## v${args.version}\` section in CHANGELOG.md (would be required for live release)`);
    emitSummary({ ok: true, created: false, tag, prerelease: args.prerelease, dryRun: true, missingChangelog: true });
    process.exit(0);
  }
  die(`no \`## v${args.version}\` section in CHANGELOG.md — agent should have added one in phase 2`);
}
info(`changelog slice: ${notes.length} chars`);

const tmp = mkdtempSync(join(tmpdir(), "memex-release-notes-"));
const notesFile = join(tmp, "notes.md");
writeFileSync(notesFile, notes, "utf8");

if (args.dryRun) {
  info(`[dry-run] notes file: ${notesFile}`);
  info(`[dry-run] would: gh release create ${tag} --title ${tag} --notes-file ${notesFile}${args.prerelease ? " --prerelease" : ""}`);
  emitSummary({ ok: true, created: false, tag, prerelease: args.prerelease, dryRun: true });
  process.exit(0);
}

const ghArgs = [
  "release",
  "create",
  tag,
  "--title",
  tag,
  "--notes-file",
  notesFile,
];
if (args.prerelease) ghArgs.push("--prerelease");

sh("gh", ghArgs);

// gh prints the URL on success but we re-derive it for the summary.
const repoInfo = shOut("gh", ["repo", "view", "--json", "url", "-q", ".url"]);
const url = repoInfo.code === 0 ? `${repoInfo.stdout}/releases/tag/${tag}` : null;

try {
  rmSync(tmp, { recursive: true, force: true });
} catch {
  /* noop */
}

ok(`GitHub Release created: ${url ?? tag}`);
emitSummary({ ok: true, created: true, tag, url, prerelease: args.prerelease, dryRun: false });
