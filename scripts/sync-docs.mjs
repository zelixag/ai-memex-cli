#!/usr/bin/env node
// Build the website with the GitHub Pages base path, sync the result into
// `docs/` (preserving `.nojekyll`, `.gitkeep`, and the hand-maintained
// `superpowers/` tree), then verify that `docs/index.html` references assets
// under `/ai-memex-cli/`. Any agent or human deploying the website MUST go
// through this script — running `pnpm --filter ./website build` directly
// produces base=/ output that 404s on github.io/ai-memex-cli/.
//
// Flags:
//   --no-build   Skip the vite build (use existing website/dist/public)
//   --no-verify  Skip the base-path check (not recommended)

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const websiteDir = join(repoRoot, "website");
const distDir = join(websiteDir, "dist", "public");
const docsDir = join(repoRoot, "docs");
const BASE_PATH = "/ai-memex-cli/";
const PRESERVE = new Set([".nojekyll", ".gitkeep", "superpowers"]);

const args = process.argv.slice(2);
const noBuild = args.includes("--no-build");
const noVerify = args.includes("--no-verify");

function log(msg) {
  process.stderr.write(`[sync-docs] ${msg}\n`);
}

function die(msg) {
  process.stderr.write(`[sync-docs] ✗ ${msg}\n`);
  process.exit(1);
}

function run(cmd, cmdArgs, cwd) {
  log(`$ ${cmd} ${cmdArgs.join(" ")}  (cwd=${cwd})`);
  const res = spawnSync(cmd, cmdArgs, { cwd, stdio: "inherit", shell: true });
  if (res.status !== 0) die(`${cmd} ${cmdArgs.join(" ")} exited with ${res.status}`);
}

if (!noBuild) {
  if (!existsSync(join(websiteDir, "package.json")))
    die(`website/package.json missing at ${websiteDir}`);
  run("pnpm", ["build:gh-pages"], websiteDir);
}

if (!existsSync(distDir))
  die(`build output missing at ${distDir} — run without --no-build first`);

if (!existsSync(docsDir))
  die(`docs/ missing at ${docsDir} — create it first (it should hold .nojekyll)`);

// Wipe everything in docs/ except the preserved entries.
for (const name of readdirSync(docsDir)) {
  if (PRESERVE.has(name)) continue;
  const full = join(docsDir, name);
  rmSync(full, { recursive: true, force: true });
}

// Copy the build output into docs/.
for (const name of readdirSync(distDir)) {
  const src = join(distDir, name);
  const dest = join(docsDir, name);
  cpSync(src, dest, {
    recursive: statSync(src).isDirectory(),
    force: true,
  });
}

log(`synced ${distDir} → ${docsDir}`);

if (!noVerify) {
  const indexPath = join(docsDir, "index.html");
  if (!existsSync(indexPath)) die(`docs/index.html missing after sync`);
  const html = readFileSync(indexPath, "utf-8");
  // Look for any `<script ... src="..."` or `<link ... href="..."` that points
  // at /assets/ without the project base. Catches the classic base=/ regression.
  const badAsset = /(?:src|href)\s*=\s*["']\/assets\//.exec(html);
  if (badAsset)
    die(
      `docs/index.html references "${badAsset[0]}" without base path — ` +
        `this means the build used base=/ instead of ${BASE_PATH}. ` +
        `Re-run via \`pnpm docs:sync\` (or \`pnpm --filter ./website build:gh-pages\`).`,
    );
  if (!html.includes(`${BASE_PATH}assets/`))
    die(
      `docs/index.html does not reference ${BASE_PATH}assets/ — ` +
        `expected the GitHub Pages base path to be embedded.`,
    );
  log(`✓ docs/index.html base path verified (${BASE_PATH})`);
}

log("done");
