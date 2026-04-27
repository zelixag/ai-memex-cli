#!/usr/bin/env node
// Phase 4: Build CLI (always) + conditionally rebuild website → docs/.
//
// CLI build: invoked by `node node_modules/typescript/bin/tsc` directly,
// bypassing corepack/pnpm. Why? On Windows + Node 22 the chain
//   orchestrator → 04-build → corepack/pnpm.js → real pnpm → tsc
// piles up enough nested spawn layers to crash libuv's `process_title`
// assertion (STATUS_STACK_BUFFER_OVERRUN). Direct-invoke fixes it.
//
// Website rebuild still goes via pnpm (vite build && esbuild ... is a chained
// script). If that hits the same assertion, re-run with --rebuild-website skip
// and rebuild docs/ manually with `cd website && pnpm build:gh-pages` from a
// fresh shell.
//
// Flags:
//   --rebuild-website auto|force|skip   Default: auto (rebuild iff source changed)
//   --dry-run                           Skip the actual build

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { sh, shOut, shPnpm } from "./_shared/shell.mjs";

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

// CLI build — direct tsc invocation to dodge Windows multi-layer spawn assertion.
if (args.dryRun) {
  info("[dry-run] would run: node node_modules/typescript/bin/tsc");
} else {
  const tscEntry = join(repoRoot, "node_modules", "typescript", "bin", "tsc");
  if (existsSync(tscEntry)) {
    info(`node typescript/bin/tsc (direct invocation, no pnpm/corepack)`);
    sh(process.execPath, [tscEntry], { cwd: repoRoot, shell: false });
  } else {
    warn("node_modules/typescript/bin/tsc not found — falling back to pnpm build");
    warn("(may crash on Windows + Node 22 with libuv process_title assertion)");
    shPnpm(["build"], { cwd: repoRoot });
  }
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
      info("[dry-run] would run: (cd website && pnpm install --frozen-lockfile && pnpm build:gh-pages) then node scripts/sync-docs.mjs --no-build");
    } else {
      shPnpm(["install", "--frozen-lockfile"], { cwd: websiteDir });
      shPnpm(["build:gh-pages"], { cwd: websiteDir });
      // Sync website/dist/public → docs/ and verify the GitHub Pages base path.
      // Without this, the build sits in dist/ and docs/ keeps stale assets.
      const syncScript = join(repoRoot, "scripts", "sync-docs.mjs");
      sh(process.execPath, [syncScript, "--no-build"], { cwd: repoRoot, shell: false });
      websiteRebuilt = true;
      ok("docs/ rebuilt + synced + base path verified");
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
