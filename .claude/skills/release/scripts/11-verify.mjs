#!/usr/bin/env node
// Phase 11: Verify the release actually landed.
//
// Checks:
//   - npm registry has the expected version (`pnpm view <pkg>@<v> version`)
//   - GitHub Release exists for the tag (skipped for beta or with --no-gh)
//
// Flags:
//   --version <X.Y.Z>   Required
//   --no-gh             Skip GitHub Release check (e.g. for beta)
//   --tag <name>        npm tag to verify on (default: latest; pass "beta" for beta)

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { hasBin, shOut } from "./_shared/shell.mjs";
import { readPkg } from "./_shared/pkg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { version: null, noGh: false, tag: "latest" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--version") args.version = argv[++i];
    else if (a === "--no-gh") args.noGh = true;
    else if (a === "--tag") args.tag = argv[++i];
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: 11-verify.mjs --version <X.Y.Z> [--no-gh] [--tag latest|beta]\n",
      );
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  if (!args.version) die("--version is required");
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

const { data: pkg } = readPkg(repoRoot);
const tag = `v${args.version}`;

step("11/11", "Verify");

// 1. npm registry — check both that the version exists, and that the tag points at it.
const versionCheck = shOut("pnpm", ["view", `${pkg.name}@${args.version}`, "version"]);
const npmOk = versionCheck.code === 0 && versionCheck.stdout === args.version;
if (npmOk) {
  ok(`npm: ${pkg.name}@${args.version} present`);
} else {
  warn(`npm verification failed: \`pnpm view\` returned "${versionCheck.stdout}" (code ${versionCheck.code})`);
}

const tagCheck = shOut("pnpm", ["view", `${pkg.name}`, `dist-tags.${args.tag}`]);
const tagOk = tagCheck.code === 0 && tagCheck.stdout === args.version;
if (tagOk) {
  ok(`npm: dist-tag "${args.tag}" → ${args.version}`);
} else {
  warn(`npm dist-tag "${args.tag}" is "${tagCheck.stdout}", expected "${args.version}"`);
}

// 2. GitHub Release
let ghOk = null;
if (!args.noGh) {
  if (!hasBin("gh")) {
    warn("gh not installed — skipping GitHub Release check");
  } else {
    const view = shOut("gh", ["release", "view", tag]);
    ghOk = view.code === 0;
    if (ghOk) ok(`gh: release ${tag} exists`);
    else warn(`gh: release ${tag} NOT found (code ${view.code})`);
  }
}

const allOk = npmOk && tagOk && (args.noGh || ghOk !== false);
if (!allOk) {
  warn("verification did not fully pass — investigate before announcing the release");
  emitSummary({ ok: false, npmOk, tagOk, ghOk });
  process.exit(1);
}

emitSummary({ ok: true, npmOk, tagOk, ghOk });
