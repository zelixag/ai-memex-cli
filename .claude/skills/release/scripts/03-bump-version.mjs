#!/usr/bin/env node
// Phase 3: Bump package.json version.
//
// Flags:
//   --bump <level>      patch|minor|major|prepatch|preminor|premajor|prerelease|release
//                       (default: patch)
//   --preid <id>        Prerelease identifier (default: beta)
//   --explicit <X.Y.Z>  Set version explicitly (overrides --bump)
//   --dry-run           Compute new version but don't write package.json

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, die, emitSummary } from "./_shared/log.mjs";
import { bumpSemver, isPrerelease, parseVersion, readPkg, writePkg } from "./_shared/pkg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

const VALID = new Set([
  "patch",
  "minor",
  "major",
  "prepatch",
  "preminor",
  "premajor",
  "prerelease",
  "release",
]);

function parseArgs(argv) {
  const args = { bump: "patch", preid: "beta", explicit: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--bump") args.bump = argv[++i];
    else if (a === "--preid") args.preid = argv[++i];
    else if (a === "--explicit") args.explicit = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: 03-bump-version.mjs [--bump <level>] [--preid <id>] [--explicit X.Y.Z] [--dry-run]\n",
      );
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  if (!VALID.has(args.bump)) die(`--bump must be one of ${[...VALID].join("|")}`);
  if (args.explicit) {
    try {
      parseVersion(args.explicit);
    } catch (e) {
      die(`--explicit ${args.explicit}: ${e.message}`);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

step("3/11", "Bump version");

const { path: pkgPath, data: pkg } = readPkg(repoRoot);
const oldVersion = pkg.version;
const newVersion = args.explicit
  ? args.explicit
  : bumpSemver(oldVersion, args.bump, args.preid);

info(`${oldVersion} → ${newVersion}${args.dryRun ? "  (dry-run)" : ""}`);

if (!args.dryRun) {
  pkg.version = newVersion;
  writePkg(pkgPath, pkg);
  ok(`package.json version is now ${newVersion}`);
}

emitSummary({
  ok: true,
  oldVersion,
  newVersion,
  isPrerelease: isPrerelease(newVersion),
  dryRun: args.dryRun,
});
