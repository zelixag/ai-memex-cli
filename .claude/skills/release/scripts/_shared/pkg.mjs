// package.json read/write + semver bumping (with prerelease support).

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function readPkg(repoRoot) {
  const path = join(repoRoot, "package.json");
  return { path, data: JSON.parse(readFileSync(path, "utf8")) };
}

export function writePkg(pkgPath, data) {
  writeFileSync(pkgPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export function parseVersion(version) {
  const m = VERSION_RE.exec(version);
  if (!m) throw new Error(`Invalid semver: ${version}`);
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] || null, // e.g. "beta.0"
  };
}

export function isPrerelease(version) {
  return parseVersion(version).prerelease !== null;
}

/**
 * Bump a semver string.
 *
 * Levels:
 *   - patch / minor / major          → standard stable bump (drops prerelease)
 *   - prepatch / preminor / premajor → bump core then start prerelease at 0
 *   - prerelease                     → continue current prerelease number,
 *                                      or start one at the patch level if none
 *   - release                        → strip prerelease (0.3.0-beta.5 → 0.3.0)
 *
 * preid defaults to "beta". When already in a different preid, prerelease
 * resets to <preid>.0.
 */
export function bumpSemver(version, level, preid = "beta") {
  const { major, minor, patch, prerelease } = parseVersion(version);

  switch (level) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      // From a prerelease of the same target version, "release" out:
      //   0.3.0-beta.2 + patch → 0.3.0  (don't double-bump)
      if (prerelease) return `${major}.${minor}.${patch}`;
      return `${major}.${minor}.${patch + 1}`;
    case "premajor":
      return `${major + 1}.0.0-${preid}.0`;
    case "preminor":
      return `${major}.${minor + 1}.0-${preid}.0`;
    case "prepatch":
      return `${major}.${minor}.${patch + 1}-${preid}.0`;
    case "prerelease": {
      if (!prerelease) {
        // No active prerelease yet — start one at the next patch.
        return `${major}.${minor}.${patch + 1}-${preid}.0`;
      }
      const [currentPreid, ...rest] = prerelease.split(".");
      const num = rest.length ? Number(rest[rest.length - 1]) : NaN;
      if (currentPreid === preid && Number.isFinite(num)) {
        rest[rest.length - 1] = String(num + 1);
        return `${major}.${minor}.${patch}-${preid}.${rest.join(".")}`;
      }
      // Different preid (or non-numeric tail) → reset.
      return `${major}.${minor}.${patch}-${preid}.0`;
    }
    case "release": {
      if (!prerelease) {
        throw new Error(
          `Cannot "release": ${version} is not a prerelease`,
        );
      }
      return `${major}.${minor}.${patch}`;
    }
    default:
      throw new Error(`Unknown bump level: ${level}`);
  }
}
