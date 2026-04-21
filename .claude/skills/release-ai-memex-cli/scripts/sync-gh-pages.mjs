#!/usr/bin/env node
/**
 * Build the Vite site with GitHub Pages base path and copy artifacts into docs/.
 * Run from repository root: node .claude/skills/release-ai-memex-cli/scripts/sync-gh-pages.mjs
 * Or: pnpm run docs:sync
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
// .claude/skills/<skill>/scripts -> four levels up to repo root
const ROOT = join(__dirname, "..", "..", "..", "..");
const WEBSITE = join(ROOT, "website");
const PUBLIC = join(WEBSITE, "dist", "public");
const DOCS = join(ROOT, "docs");

function rmrf(p) {
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

function main() {
  const build = spawnSync("pnpm", ["run", "build:gh-pages"], {
    cwd: WEBSITE,
    stdio: "inherit",
    shell: true,
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }

  if (!existsSync(PUBLIC)) {
    console.error(`Expected build output at ${PUBLIC}`);
    process.exit(1);
  }

  mkdirSync(DOCS, { recursive: true });
  rmrf(join(DOCS, "assets"));
  rmrf(join(DOCS, "index.html"));

  for (const name of readdirSync(PUBLIC)) {
    const src = join(PUBLIC, name);
    const dst = join(DOCS, name);
    cpSync(src, dst, { recursive: true });
  }

  const nojekyll = join(DOCS, ".nojekyll");
  if (!existsSync(nojekyll)) writeFileSync(nojekyll, "", "utf8");

  console.log(`Synced ${PUBLIC} -> ${DOCS}`);
}

main();
