#!/usr/bin/env node
// Phase 8: pnpm publish to npm.
//
// Flags:
//   --beta       Publish with --tag beta (instead of default "latest")
//   --dry-run    Run `pnpm publish --dry-run` (server-side validation, no upload)

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, die, emitSummary } from "./_shared/log.mjs";
import { shPnpm } from "./_shared/shell.mjs";
import { readPkg } from "./_shared/pkg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { beta: false, dryRun: false };
  for (const a of argv) {
    if (a === "--beta") args.beta = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write("Usage: 08-publish.mjs [--beta] [--dry-run]\n");
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

const { data: pkg } = readPkg(repoRoot);
const tag = args.beta ? "beta" : "latest";

step("8/11", `pnpm publish (${pkg.name}@${pkg.version} → npm tag "${tag}")`);

const cmd = ["publish", "--no-git-checks", "--access", "public", "--tag", tag];
if (args.dryRun) cmd.push("--dry-run");

info(`pnpm ${cmd.join(" ")}`);
shPnpm(cmd, { cwd: repoRoot });

ok(args.dryRun ? "dry-run publish OK" : `published ${pkg.name}@${pkg.version} (tag: ${tag})`);

emitSummary({
  ok: true,
  published: !args.dryRun,
  package: pkg.name,
  version: pkg.version,
  tag,
  dryRun: args.dryRun,
});
