#!/usr/bin/env node
/**
 * release.mjs — one-command release pipeline for ai-memex-cli.
 *
 * Flow:
 *   1. Preflight    — clean tree, on release branch, claude/pnpm available
 *   2. Agent sync   — Claude Code edits CHANGELOG.md, README.md, README.zh-CN.md
 *                     and docs/website i18n files to match current CLI behaviour
 *   3. Human review — show `git diff --stat`, prompt to accept (unless --yes)
 *   4. Version bump — patch/minor/major on package.json (semver, no changelogen
 *                     rewrite, because the agent already refreshed CHANGELOG)
 *   5. Build        — pnpm build (must pass)
 *   6. Test         — pnpm test:run (unless --skip-tests)
 *   7. Git commit + tag
 *   8. pnpm publish (unless --dry-run)
 *   9. Optional push (if --push or interactive confirm)
 *
 * Flags:
 *   --bump <patch|minor|major>   Version bump level (default: patch)
 *   --dry-run                    Do everything except git commit/tag and publish
 *   --no-agent                   Skip the Claude Code doc-sync stage
 *   --skip-tests                 Skip `pnpm test:run`
 *   --yes                        Auto-accept all prompts
 *   --push                       git push origin + tag after publish (non-interactive)
 *   --branch <name>              Expected current branch (default: master)
 *   --help                       Print usage
 *
 * Example:
 *   pnpm release                              # interactive patch release
 *   pnpm release --bump minor --yes --push    # fully automated minor release
 *   pnpm release --dry-run                    # preview without publishing
 *   pnpm release --no-agent --skip-tests      # fast path when docs already match
 */

import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

// ── Color helpers ────────────────────────────────────────────────────────────
const isTTY = process.stdout.isTTY;
const c = (code) => (s) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const dim = c("2");
const bold = c("1");
const red = c("31");
const green = c("32");
const yellow = c("33");
const cyan = c("36");

function step(n, title) {
  console.log(`\n${bold(cyan(`[${n}]`))} ${bold(title)}`);
}
function info(msg) {
  console.log(`  ${dim("›")} ${msg}`);
}
function ok(msg) {
  console.log(`  ${green("✓")} ${msg}`);
}
function warn(msg) {
  console.log(`  ${yellow("!")} ${msg}`);
}
function fail(msg) {
  console.error(`\n${red(bold("✗"))} ${red(msg)}`);
}
function die(msg, code = 1) {
  fail(msg);
  process.exit(code);
}

// ── Arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    bump: "patch",
    dryRun: false,
    noAgent: false,
    skipTests: false,
    yes: false,
    push: false,
    branch: "master",
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--bump":
        args.bump = argv[++i];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--no-agent":
        args.noAgent = true;
        break;
      case "--skip-tests":
        args.skipTests = true;
        break;
      case "--yes":
      case "-y":
        args.yes = true;
        break;
      case "--push":
        args.push = true;
        break;
      case "--branch":
        args.branch = argv[++i];
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        if (a?.startsWith("--")) {
          die(`Unknown flag: ${a}`);
        }
    }
  }
  if (!["patch", "minor", "major"].includes(args.bump)) {
    die(`--bump must be patch|minor|major, got "${args.bump}"`);
  }
  return args;
}

function printHelp() {
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const header = src.match(/\/\*\*[\s\S]*?\*\//)?.[0] ?? "";
  console.log(header.replace(/^\s*\*\s?/gm, "").trim());
}

// ── Shell utilities ──────────────────────────────────────────────────────────
function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: opts.silent ? "pipe" : "inherit",
    shell: process.platform === "win32",
    encoding: "utf8",
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) {
    fail(`${cmd} ${args.join(" ")} exited with code ${r.status}`);
    if (opts.silent) {
      if (r.stdout) console.error(r.stdout);
      if (r.stderr) console.error(r.stderr);
    }
    process.exit(r.status ?? 1);
  }
  return r;
}

function shOut(cmd, args) {
  const r = sh(cmd, args, { silent: true, allowFail: true });
  return { stdout: (r.stdout ?? "").trim(), stderr: (r.stderr ?? "").trim(), code: r.status };
}

function hasBin(name) {
  const probe = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(probe, [name], { encoding: "utf8", shell: process.platform === "win32" });
  return r.status === 0;
}

function prompt(question) {
  return new Promise((resolveP) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`  ${cyan("?")} ${question} `, (ans) => {
      rl.close();
      resolveP(ans.trim());
    });
  });
}

async function confirm(question, defaultYes = false) {
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const ans = (await prompt(`${question} ${hint}`)).toLowerCase();
  if (!ans) return defaultYes;
  return ans === "y" || ans === "yes";
}

// ── Version bump ─────────────────────────────────────────────────────────────
function readPkg() {
  const p = join(repoRoot, "package.json");
  return { path: p, data: JSON.parse(readFileSync(p, "utf8")) };
}

function writePkg(pkgPath, data) {
  writeFileSync(pkgPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function bumpSemver(version, level) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!m) die(`Invalid version in package.json: ${version}`);
  let [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  switch (level) {
    case "major":
      major++; minor = 0; patch = 0; break;
    case "minor":
      minor++; patch = 0; break;
    case "patch":
      patch++; break;
  }
  return `${major}.${minor}.${patch}`;
}

// ── Agent invocation ─────────────────────────────────────────────────────────
const AGENT_PROMPT_TEMPLATE = ({ oldVersion, newVersion, gitDiffStat, gitLog }) => `\
You are preparing a release of the \`ai-memex-cli\` project.

**Current version:** ${oldVersion}
**Target version:** ${newVersion}

## Your task

Walk through the recent code changes below and **update the documentation so it accurately reflects the current CLI behaviour**. The version bump (package.json) and git operations are handled separately by the release script — DO NOT edit package.json and DO NOT run git commit/tag/push.

### Files you may edit

1. \`CHANGELOG.md\` — add a \`## v${newVersion}\` section (above existing versions) that summarises the real changes from the git log. If a \`## Unreleased\` section already exists, convert it into the \`v${newVersion}\` section. Keep the \`## Unreleased\` heading at the top with an empty body for future work.
2. \`README.md\` — if any new command, flag, or behaviour is visible in the git diff, update the relevant section. Keep the \`## Why this exists\` and \`## What \`memex\` gives you\` sections aligned with the code reality. Do NOT rewrite content that still matches reality.
3. \`README.zh-CN.md\` — keep structure and content in lockstep with README.md. Both must stay bilingual-parallel.
4. \`docs/website/client/src/i18n/en-US.ts\` and \`docs/website/client/src/i18n/zh-CN.ts\` — update hero copy / feature bullets / command examples if relevant. Both must stay parallel.

### Files you MUST NOT touch

- \`package.json\` (version bump happens later in the script)
- Any file under \`src/\` (this is a doc sync, not a code edit)
- Any file under \`dist/\` (will be rebuilt)
- \`node_modules/\` (obviously)
- Git commits, tags, pushes (the release script handles all git operations)

### Recent git log (since last release)

\`\`\`
${gitLog}
\`\`\`

### Recent changed files (--stat)

\`\`\`
${gitDiffStat}
\`\`\`

### Editing rules

- Be **conservative**: only rewrite a sentence if the git diff shows the current text is stale. Do not reflow unchanged content.
- For CHANGELOG: follow Conventional Commits conventions. Group by \`### Features\` / \`### Bug Fixes\` / \`### Documentation\` / \`### Internal\`. Use one-line bullets referencing the short commit SHA at the end.
- Keep English tone crisp and factual; keep Chinese tone matching the existing README.zh-CN.md style (concise, technical, second-person).
- If a change in the git diff is purely internal refactoring (no user-visible surface change), mention it in CHANGELOG but do NOT add README entries for it.
- If something in the git diff is genuinely unclear (you can't tell whether it's user-visible or not), prefer adding it to CHANGELOG under \`### Internal\` only.

Output nothing to stdout except a short summary of which files you changed. Use the Edit/Write tools to apply the edits.
`;

async function runAgentSync({ oldVersion, newVersion }) {
  if (!hasBin("claude")) {
    warn("`claude` binary not found in PATH — skipping agent sync. Run with --no-agent to hide this warning.");
    return { ran: false };
  }

  // Gather inputs
  const lastTag = shOut("git", ["describe", "--tags", "--abbrev=0"]).stdout || null;
  const logRange = lastTag ? `${lastTag}..HEAD` : "HEAD";
  const gitLog = shOut("git", ["log", logRange, "--oneline", "--no-decorate", "-n", "50"]).stdout
    || "(no commits since last tag)";
  const diffArgs = lastTag
    ? ["diff", "--stat", lastTag, "HEAD"]
    : ["diff", "--stat", "HEAD"];
  const gitDiffStat = shOut("git", diffArgs).stdout || "(no diff)";

  const promptText = AGENT_PROMPT_TEMPLATE({ oldVersion, newVersion, gitDiffStat, gitLog });
  const tmp = mkdtempSync(join(tmpdir(), "memex-release-"));
  const promptFile = join(tmp, "prompt.md");
  writeFileSync(promptFile, promptText, "utf8");
  info(`Prompt written to ${promptFile}`);

  // Invoke claude code in headless mode, stream output
  const args = [
    "-p",
    promptText,
    "--permission-mode", "acceptEdits",
    "--allowedTools", "Read,Write,Edit,Glob,Grep,Bash",
  ];
  info(`Invoking: claude -p <prompt> --permission-mode acceptEdits ...`);

  const code = await new Promise((resolveP) => {
    const child = spawn("claude", args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", (err) => {
      fail(`Failed to spawn claude: ${err.message}`);
      resolveP(1);
    });
    child.on("close", (exitCode) => resolveP(exitCode ?? 0));
  });

  // Best-effort cleanup
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* noop */ }

  if (code !== 0) {
    die(`Claude Code exited with code ${code}. Aborting release — review the working tree manually.`);
  }
  return { ran: true };
}

// ── Preflight ────────────────────────────────────────────────────────────────
function preflight(args) {
  step("1/8", "Preflight");

  // pnpm availability
  if (!hasBin("pnpm")) die("pnpm is not in PATH");
  ok("pnpm is available");

  // git repo
  const inRepo = shOut("git", ["rev-parse", "--is-inside-work-tree"]).stdout === "true";
  if (!inRepo) die("Not inside a git repository");

  // Current branch check
  const currentBranch = shOut("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout;
  if (currentBranch !== args.branch) {
    warn(`Current branch is "${currentBranch}", expected "${args.branch}" (override with --branch ${currentBranch})`);
  } else {
    ok(`On branch ${currentBranch}`);
  }

  // Working tree cleanliness
  const status = shOut("git", ["status", "--porcelain"]).stdout;
  if (status) {
    warn("Working tree has uncommitted changes:");
    for (const line of status.split("\n")) console.log(`      ${dim(line)}`);
    warn("These will be included in the release commit after the agent + bump stages complete.");
  } else {
    ok("Working tree clean");
  }

  // Node version
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 20) die(`Node ${process.version} is too old; need >= 20`);
  ok(`Node ${process.version}`);

  // claude binary (optional)
  if (!args.noAgent) {
    if (hasBin("claude")) {
      ok("claude (Claude Code) is available");
    } else {
      warn("claude not found — agent sync will be skipped");
    }
  }

  // npm auth (non-fatal heuristic)
  if (!args.dryRun) {
    const who = shOut("pnpm", ["whoami"]);
    if (who.code !== 0) {
      warn("`pnpm whoami` failed — you may not be logged in to npm. Run `pnpm login` first.");
    } else if (who.stdout) {
      ok(`npm user: ${who.stdout}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  console.log(bold(cyan(`\nai-memex-cli release pipeline`)));
  const modeBits = [
    args.dryRun ? yellow("DRY-RUN") : green("LIVE"),
    `bump=${args.bump}`,
    args.noAgent ? "no-agent" : "agent-sync",
    args.skipTests ? "no-tests" : "tests",
    args.yes ? "unattended" : "interactive",
  ];
  info(modeBits.join(" · "));

  preflight(args);

  const { path: pkgPath, data: pkg } = readPkg();
  const oldVersion = pkg.version;
  const newVersion = bumpSemver(oldVersion, args.bump);
  info(`Version: ${bold(oldVersion)} → ${bold(green(newVersion))}`);

  if (!args.yes) {
    const ok = await confirm(`Proceed with release ${newVersion}?`, true);
    if (!ok) die("Aborted by user.", 130);
  }

  // 2. Agent sync
  step("2/8", "Documentation sync via Claude Code");
  if (args.noAgent) {
    info("Skipped (--no-agent)");
  } else {
    await runAgentSync({ oldVersion, newVersion });
    // Show what the agent changed
    const changed = shOut("git", ["status", "--porcelain"]).stdout;
    if (changed) {
      console.log();
      info("Files touched by the agent:");
      for (const line of changed.split("\n")) console.log(`      ${dim(line)}`);
      if (!args.yes) {
        const accept = await confirm("Accept these changes and continue?", true);
        if (!accept) die("Aborted by user — working tree left as-is for manual review.", 130);
      }
    } else {
      info("Agent made no changes (docs already match code).");
    }
  }

  // 3. Version bump
  step("3/8", `Bumping package.json → ${newVersion}`);
  pkg.version = newVersion;
  writePkg(pkgPath, pkg);
  ok(`package.json version is now ${newVersion}`);

  // 4. Build
  step("4/8", "Build");
  sh("pnpm", ["build"]);
  ok("Build succeeded");

  // 5. Test
  step("5/8", "Tests");
  if (args.skipTests) {
    info("Skipped (--skip-tests)");
  } else {
    sh("pnpm", ["test:run"]);
    ok("Tests passed");
  }

  // 6. Git commit
  step("6/8", "Git commit & tag");
  if (args.dryRun) {
    info(`[dry-run] Would: git add -A && git commit -m "release: v${newVersion}" && git tag v${newVersion}`);
  } else {
    sh("git", ["add", "-A"]);
    const hasChanges = shOut("git", ["diff", "--cached", "--quiet"]).code !== 0;
    if (!hasChanges) {
      warn("No changes staged — skipping commit, creating tag only.");
    } else {
      sh("git", ["commit", "-m", `release: v${newVersion}`]);
      ok(`Committed: release: v${newVersion}`);
    }
    sh("git", ["tag", `v${newVersion}`]);
    ok(`Tagged: v${newVersion}`);
  }

  // 7. Publish
  step("7/8", "pnpm publish");
  if (args.dryRun) {
    info(`[dry-run] Would: pnpm publish --no-git-checks --access public`);
    sh("pnpm", ["publish", "--no-git-checks", "--access", "public", "--dry-run"]);
  } else {
    sh("pnpm", ["publish", "--no-git-checks", "--access", "public"]);
    ok(`Published ai-memex-cli@${newVersion} to npm`);
  }

  // 8. Push
  step("8/8", "Push to origin");
  if (args.dryRun) {
    info("[dry-run] Would: git push origin HEAD && git push origin v" + newVersion);
  } else {
    let shouldPush = args.push;
    if (!shouldPush && !args.yes) {
      shouldPush = await confirm("Push commit + tag to origin now?", true);
    }
    if (shouldPush) {
      sh("git", ["push", "origin", "HEAD"]);
      sh("git", ["push", "origin", `v${newVersion}`]);
      ok("Pushed to origin");
    } else {
      info(`Skipped. To push later: git push origin HEAD && git push origin v${newVersion}`);
    }
  }

  console.log();
  console.log(green(bold(`✔ Released v${newVersion}`)));
  console.log(dim(`  https://www.npmjs.com/package/${pkg.name}`));
}

main().catch((err) => {
  fail(err.stack || err.message || String(err));
  process.exit(1);
});
