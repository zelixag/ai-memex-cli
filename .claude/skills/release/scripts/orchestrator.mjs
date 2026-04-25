#!/usr/bin/env node
// Orchestrator — runs all 11 release phases in order with confirmations between
// the high-risk steps. Used as the entry point for `pnpm release`.
//
// Each phase is a separate child process. Stdout from each phase is forwarded
// verbatim, but we sniff the trailing `::summary:: <json>` line to drive
// downstream decisions.
//
// Flags (pass `--help` for the table):
//   --bump <level>           patch|minor|major|prepatch|preminor|premajor|prerelease|release
//   --explicit <X.Y.Z>       Skip --bump computation, force this version
//   --beta                   Shortcut: --bump prerelease + npm tag beta + skip GH Release
//   --preid <id>             Prerelease identifier (default: beta)
//   --branch <name>          Expected current branch (default: main)
//   --remote <name>          Push remote (default: origin)
//   --rebuild-website auto|force|skip   (default: auto)
//   --skip-tests             Skip phase 5
//   --manual-docs            Skip phase 2 agent — edit docs by hand instead
//   --dry-run                Phases 1-6 run for real; 7/9/11 are skipped, 8
//                            adds --dry-run, 10 is skipped.
//   --yes / -y               Auto-accept every confirmation
//   --push                   After publish, push without asking (default: ask)
//   --no-push                Never push (skip phase 9 outright)
//
// Convenience presets:
//   pnpm release                          patch stable, interactive
//   pnpm release --bump minor             minor stable
//   pnpm release --beta                   beta continuation (prerelease bump)
//   pnpm release --bump prepatch --beta   start a beta cycle (X.Y.Z → X.Y.Z+1-beta.0)
//   pnpm release --dry-run                full dry-run

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bold,
  cyan,
  dim,
  green,
  yellow,
  step,
  info,
  ok,
  warn,
  fail,
} from "./_shared/log.mjs";
import { resetConsole, shOut } from "./_shared/shell.mjs";
import { readPkg } from "./_shared/pkg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");
const scriptsDir = __dirname;

// ── Args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    bump: null, // null = decide later (default patch unless --beta)
    explicit: null,
    beta: false,
    preid: "beta",
    branch: "main",
    remote: "origin",
    rebuildWebsite: "auto",
    skipTests: false,
    manualDocs: false,
    dryRun: false,
    yes: false,
    push: null, // null = ask
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--bump": args.bump = argv[++i]; break;
      case "--explicit": args.explicit = argv[++i]; break;
      case "--beta": args.beta = true; break;
      case "--preid": args.preid = argv[++i]; break;
      case "--branch": args.branch = argv[++i]; break;
      case "--remote": args.remote = argv[++i]; break;
      case "--rebuild-website": args.rebuildWebsite = argv[++i]; break;
      case "--skip-tests": args.skipTests = true; break;
      case "--manual-docs": args.manualDocs = true; break;
      case "--dry-run": args.dryRun = true; break;
      case "--yes":
      case "-y": args.yes = true; break;
      case "--push": args.push = true; break;
      case "--no-push": args.push = false; break;
      case "--help":
      case "-h": args.help = true; break;
      default:
        fail(`Unknown flag: ${a}`);
        process.exit(1);
    }
  }
  // Defaults
  if (!args.bump && !args.explicit) {
    args.bump = args.beta ? "prerelease" : "patch";
  }
  return args;
}

function printHelp() {
  process.stdout.write(`\
ai-memex-cli release orchestrator
=================================

Usage:  pnpm release [flags]

Common:
  --bump <level>          patch|minor|major|prepatch|preminor|premajor|prerelease|release
  --explicit <X.Y.Z>      Force exact version (overrides --bump)
  --beta                  Beta channel: bump = prerelease, npm tag = beta,
                          GitHub Release skipped
  --dry-run               Phases 1-6 run; 7/9/11 skipped; 8 = pnpm publish --dry-run; 10 skipped
  --yes / -y              Skip all confirmations (CI mode)

Less common:
  --preid <id>            Prerelease identifier (default: beta)
  --branch <name>         Expected current branch (default: main)
  --remote <name>         Push remote (default: origin)
  --rebuild-website auto|force|skip
  --skip-tests            Skip phase 5
  --manual-docs           Skip claude doc-sync (edit docs by hand)
  --push / --no-push      Force decision for phase 9

Presets:
  pnpm release                          patch stable, interactive
  pnpm release --bump minor             minor stable
  pnpm release --beta                   beta continuation
  pnpm release --bump prepatch --beta   start a beta cycle
  pnpm release --dry-run                full dry-run preview
`);
}

// ── Phase runner ─────────────────────────────────────────────────────────────
/**
 * Run a phase script as a child process, forward all output to parent stderr,
 * but capture stdout to parse the trailing `::summary:: <json>` line.
 */
function runPhase(scriptName, scriptArgs) {
  return new Promise((resolveP, rejectP) => {
    resetConsole();
    const child = spawn(process.execPath, [join(scriptsDir, scriptName), ...scriptArgs], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "inherit"],
      windowsHide: true,
    });

    let stdout = "";
    child.stdout.on("data", (chunk) => {
      const s = chunk.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.on("error", rejectP);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectP(new Error(`${scriptName} exited with code ${code}`));
        return;
      }
      // Last ::summary:: line wins
      const lines = stdout.split("\n");
      let summary = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].match(/^::summary::\s*(.+)$/);
        if (m) {
          try { summary = JSON.parse(m[1]); } catch { /* ignore */ }
          break;
        }
      }
      resolveP({ code, summary });
    });
  });
}

// ── Confirm ──────────────────────────────────────────────────────────────────
function prompt(question) {
  return new Promise((resolveP) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question(`  ${cyan("?")} ${question} `, (ans) => {
      rl.close();
      resolveP(ans.trim());
    });
  });
}

async function confirm(question, defaultYes, autoYes) {
  if (autoYes) return true;
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const ans = (await prompt(`${question} ${hint}`)).toLowerCase();
  if (!ans) return defaultYes;
  return ans === "y" || ans === "yes";
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  process.chdir(repoRoot);

  process.stderr.write(bold(cyan("\nai-memex-cli release pipeline\n")));
  const modeBits = [
    args.dryRun ? yellow("DRY-RUN") : green("LIVE"),
    args.beta ? "beta" : "stable",
    args.explicit ? `explicit=${args.explicit}` : `bump=${args.bump}`,
    args.manualDocs ? "manual-docs" : "agent-docs",
    args.skipTests ? "no-tests" : "tests",
    args.yes ? "unattended" : "interactive",
  ];
  info(modeBits.join(" · "));

  // ─ Phase 1: preflight ─
  const p1Args = [
    "--branch", args.branch,
    ...(args.manualDocs ? ["--no-claude"] : []),
    ...(args.dryRun ? ["--no-npm-auth"] : []),
  ];
  const p1 = await runPhase("01-preflight.mjs", p1Args);

  // ─ Phase 3 (peek): compute target version BEFORE phase 2 (agent needs it) ─
  // We run bump dry-run first, then proper phase 2, then real phase 3. This
  // avoids the chicken-and-egg of the agent needing newVersion in CHANGELOG.
  const peekArgs = args.explicit
    ? ["--explicit", args.explicit, "--dry-run"]
    : ["--bump", args.bump, "--preid", args.preid, "--dry-run"];
  const peek = await runPhase("03-bump-version.mjs", peekArgs);
  if (!peek.summary?.ok) throw new Error("version peek failed");
  const newVersion = peek.summary.newVersion;
  const isBeta = args.beta || peek.summary.isPrerelease;
  info(`target: ${peek.summary.oldVersion} → ${bold(green(newVersion))}${isBeta ? "  (beta)" : ""}`);

  if (!await confirm(`Proceed with release ${newVersion}?`, true, args.yes)) {
    fail("aborted by user");
    process.exit(130);
  }

  // ─ Phase 2: sync docs ─
  const p2Args = ["--new-version", newVersion, ...(args.manualDocs ? ["--manual"] : [])];
  await runPhase("02-sync-docs.mjs", p2Args).catch((err) => {
    if (!args.manualDocs) {
      warn("agent doc-sync failed.");
      warn("Re-run with --manual-docs to skip the agent and edit docs by hand.");
    }
    throw err;
  });

  // Pause for user to review agent's diff (or manual edits).
  const dirtyAfterDocs = shOut("git", ["status", "--porcelain"]).stdout;
  if (dirtyAfterDocs) {
    info("Working tree after doc-sync:");
    for (const line of dirtyAfterDocs.split("\n")) process.stderr.write(`      ${dim(line)}\n`);
    if (!await confirm("Accept these doc changes and continue?", true, args.yes)) {
      fail("aborted by user — working tree left as-is");
      process.exit(130);
    }
  } else {
    info("doc-sync produced no changes");
  }

  // ─ Phase 3 (real): bump version ─
  const p3Args = args.explicit
    ? ["--explicit", args.explicit, ...(args.dryRun ? ["--dry-run"] : [])]
    : ["--bump", args.bump, "--preid", args.preid, ...(args.dryRun ? ["--dry-run"] : [])];
  await runPhase("03-bump-version.mjs", p3Args);

  // ─ Phase 4: build ─
  await runPhase("04-build-all.mjs", [
    "--rebuild-website", args.rebuildWebsite,
    ...(args.dryRun ? ["--dry-run"] : []),
  ]);

  // ─ Phase 5: test ─
  await runPhase("05-test.mjs", args.skipTests ? ["--skip"] : []);

  // ─ Phase 6: pack preview ─
  // In dry-run we may not have a fresh dist/ if phase 4 was skipped. Skip
  // pack-preview entirely in dry-run to avoid false positives.
  if (args.dryRun) {
    step("6/11", "Pack preview");
    info("[dry-run] skipped (phase 4 also skipped, no fresh dist/ to inspect)");
  } else {
    await runPhase("06-pack-preview.mjs", []);
    if (!await confirm("Tarball contents look right — continue to commit + publish?", true, args.yes)) {
      fail("aborted by user — no git write, no publish");
      process.exit(130);
    }
  }

  // ─ Phase 7: git commit + tag ─
  if (args.dryRun) {
    await runPhase("07-git-finalize.mjs", ["--version", newVersion, "--dry-run"]);
  } else {
    // Final review of full working tree.
    const finalStatus = shOut("git", ["status", "--porcelain"]).stdout;
    if (finalStatus) {
      info("Final working-tree state (will go into the release commit):");
      for (const line of finalStatus.split("\n")) process.stderr.write(`      ${dim(line)}\n`);
    }
    if (!await confirm(`Last chance — commit, tag v${newVersion}, and publish to npm?`, true, args.yes)) {
      fail("aborted by user — no git write, no publish");
      process.exit(130);
    }
    await runPhase("07-git-finalize.mjs", ["--version", newVersion]);
  }

  // ─ Phase 8: publish ─
  await runPhase("08-publish.mjs", [
    ...(isBeta ? ["--beta"] : []),
    ...(args.dryRun ? ["--dry-run"] : []),
  ]);

  // ─ Phase 9: push ─
  let shouldPush = false;
  if (args.dryRun) {
    await runPhase("09-git-push.mjs", ["--version", newVersion, "--remote", args.remote, "--dry-run"]);
  } else if (args.push === false) {
    info(`phase 9 skipped (--no-push). Push later with: git push ${args.remote} HEAD && git push ${args.remote} v${newVersion}`);
  } else {
    shouldPush = args.push === true || (await confirm(`Push commit + tag v${newVersion} to ${args.remote}?`, true, args.yes));
    if (shouldPush) {
      await runPhase("09-git-push.mjs", ["--version", newVersion, "--remote", args.remote]);
    } else {
      info(`phase 9 skipped. Push later with: git push ${args.remote} HEAD && git push ${args.remote} v${newVersion}`);
    }
  }

  // ─ Phase 10: GitHub Release ─
  if (args.dryRun) {
    if (isBeta) {
      step("10/11", "GitHub Release");
      info("[dry-run] skipped (beta releases don't create GitHub Releases)");
    } else {
      await runPhase("10-github-release.mjs", ["--version", newVersion, "--dry-run"]);
    }
  } else if (isBeta) {
    step("10/11", "GitHub Release");
    info("skipped (beta release)");
  } else if (!shouldPush) {
    step("10/11", "GitHub Release");
    warn("skipped — tag wasn't pushed, gh would fail. Push the tag and run phase 10 manually.");
  } else {
    await runPhase("10-github-release.mjs", ["--version", newVersion]);
  }

  // ─ Phase 11: verify ─
  if (args.dryRun) {
    step("11/11", "Verify");
    info("[dry-run] skipped (nothing was actually published)");
  } else {
    await runPhase("11-verify.mjs", [
      "--version", newVersion,
      "--tag", isBeta ? "beta" : "latest",
      ...(isBeta ? ["--no-gh"] : []),
    ]);
  }

  process.stderr.write("\n");
  if (args.dryRun) {
    process.stderr.write(yellow(bold(`✔ Dry-run complete — would release v${newVersion}\n`)));
    process.stderr.write(dim("  No files, tags, commits, or npm packages were actually written.\n"));
  } else {
    process.stderr.write(green(bold(`✔ Released v${newVersion}\n`)));
    const { data: pkg } = readPkg(repoRoot);
    process.stderr.write(dim(`  https://www.npmjs.com/package/${pkg.name}\n`));
  }
}

main().catch((err) => {
  fail(err.stack || err.message || String(err));
  process.exit(1);
});
