#!/usr/bin/env node
// Phase 9: push HEAD + tag to remote.
//
// Flags:
//   --version <X.Y.Z>   Required (tag = vX.Y.Z)
//   --remote <name>     Default: origin
//   --dry-run           Print without running

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, die, emitSummary } from "./_shared/log.mjs";
import { sh } from "./_shared/shell.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { version: null, remote: "origin", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--version") args.version = argv[++i];
    else if (a === "--remote") args.remote = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: 09-git-push.mjs --version <X.Y.Z> [--remote origin] [--dry-run]\n",
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
step("9/11", `Push ${tag} → ${args.remote}`);

if (args.dryRun) {
  info(`[dry-run] would: git push ${args.remote} HEAD && git push ${args.remote} ${tag}`);
  emitSummary({ ok: true, pushed: false, dryRun: true });
  process.exit(0);
}

sh("git", ["push", args.remote, "HEAD"]);
sh("git", ["push", args.remote, tag]);
ok(`pushed HEAD + ${tag}`);

emitSummary({ ok: true, pushed: true, remote: args.remote, tag, dryRun: false });
