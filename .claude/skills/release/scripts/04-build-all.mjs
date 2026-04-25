#!/usr/bin/env node
// Phase 4: Build CLI (always) + conditionally rebuild website → docs/.
//
// The website source lives at website/, and `cd website && pnpm build:gh-pages`
// emits the GitHub Pages bundle into docs/. We only rebuild docs/ if the agent
// touched website source in phase 2 (or the user forces it).
//
// Flags:
//   --rebuild-website auto|force|skip   Default: auto (rebuild iff source changed)
//   --dry-run                           Skip pnpm install + build

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { shOut, shPnpm } from "./_shared/shell.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { rebuildWebsite: "auto", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--rebuild-website") args.rebuildWebsite = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: 04-build-all.mjs [--rebuild-website auto|force|skip] [--dry-run]\n",
      );
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  if (!["auto", "force", "skip"].includes(args.rebuildWebsite))
    die(`--rebuild-website must be auto|force|skip`);
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

step("4/11", "Build");

// CLI build
if (args.dryRun) {
  info("[dry-run] would run: pnpm build");
} else {
  shPnpm(["build"], { cwd: repoRoot });
  ok("CLI built (dist/)");
}

// Website rebuild decision
const websiteDir = join(repoRoot, "website");
const websitePkg = join(websiteDir, "package.json");
let websiteRebuilt = false;
let reason = "";

if (!existsSync(websitePkg)) {
  reason = "website/package.json missing";
  info(`skip website rebuild — ${reason}`);
} else if (args.rebuildWebsite === "skip") {
  reason = "--rebuild-website skip";
  info(`skip website rebuild — ${reason}`);
} else {
  let shouldRebuild;
  if (args.rebuildWebsite === "force") {
    shouldRebuild = true;
    reason = "forced via --rebuild-website force";
  } else {
    // auto: did anything under website/client/src/ change in the working tree?
    const status = shOut("git", ["status", "--porcelain"]).stdout;
    const websiteSourceTouched = status
      .split("\n")
      .some((l) => /(^|\s)website\/client\/src\//.test(l));
    shouldRebuild = websiteSourceTouched;
    reason = websiteSourceTouched
      ? "website/client/src/ has changes"
      : "no website source changes";
  }
  info(`website rebuild decision: ${shouldRebuild ? "yes" : "no"} (${reason})`);

  if (shouldRebuild) {
    if (args.dryRun) {
      info("[dry-run] would run: (cd website && pnpm install --frozen-lockfile && pnpm build:gh-pages)");
    } else {
      shPnpm(["install", "--frozen-lockfile"], { cwd: websiteDir });
      shPnpm(["build:gh-pages"], { cwd: websiteDir });
      websiteRebuilt = true;
      ok("docs/ rebuilt from website/ source");
    }
  }
}

emitSummary({
  ok: true,
  cliBuilt: !args.dryRun,
  websiteRebuilt,
  reason,
  dryRun: args.dryRun,
});
