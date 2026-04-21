#!/usr/bin/env node
/**
 * release.mjs — one-command release pipeline for ai-memex-cli.
 *
 * Flow:
 *   1. Preflight     — clean tree, on release branch, claude/pnpm available
 *   2. Agent sync    — Claude Code edits CHANGELOG.md, README.md,
 *                      README.zh-CN.md, and docs/website/client/src/** (i18n +
 *                      section components + pages) so CLI, docs, and site all
 *                      tell the same story.
 *   3. Human review  — show `git status --porcelain`, prompt to accept.
 *   4. Version bump  — patch/minor/major on package.json (semver).
 *   5. Build CLI     — pnpm build (must pass).
 *   6. Rebuild docs  — if the agent touched any docs/website/** source,
 *                      `cd docs/website && pnpm install && pnpm build:gh-pages`
 *                      to regenerate docs/index.html + docs/assets/**.
 *   7. Tests         — pnpm test:run (unless --skip-tests).
 *   8. Git commit + tag.
 *   9. pnpm publish (unless --dry-run).
 *  10. Optional push (if --push or interactive confirm).
 *
 * Flags:
 *   --bump <patch|minor|major>   Version bump level (default: patch)
 *   --dry-run                    Do everything except writing package.json,
 *                                rebuilding docs, git commit/tag, and publishing
 *   --no-agent                   Skip the Claude Code doc-sync stage
 *   --no-rebuild-docs            Never rebuild docs/ even if website source changed
 *   --rebuild-docs               Always rebuild docs/, even if no source changed
 *   --skip-tests                 Skip `pnpm test:run`
 *   --yes                        Auto-accept all prompts
 *   --push                       git push origin + tag after publish (non-interactive)
 *   --branch <name>              Expected current branch (default: main)
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
import { join, dirname, resolve, sep } from "node:path";
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
    branch: "main",
    rebuildDocs: "auto", // "auto" | "force" | "skip"
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
      case "--rebuild-docs":
        args.rebuildDocs = "force";
        break;
      case "--no-rebuild-docs":
        args.rebuildDocs = "skip";
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

/**
 * Reset terminal state on Windows before spawning children. Claude Code's TUI
 * (ink) leaves ANSI attrs / window title / cursor-mode in a weird state, and
 * that has been known to trip libuv's `process_title` assertion in children
 * spawned afterwards (STATUS_STACK_BUFFER_OVERRUN / exit 3221226505). Writing
 * SGR-reset + empty-OSC-title before each spawn wipes the slate.
 */
function resetConsole() {
  if (process.platform === "win32" && process.stdout.isTTY) {
    process.stdout.write("\x1b[0m\x1b]0;\x07");
  }
}

function sh(cmd, args, opts = {}) {
  resetConsole();
  // Default stdio: inherit stdout/stderr for visibility, but IGNORE stdin so
  // the child can't inherit a half-polluted TTY from the parent. Callers that
  // need to capture output pass { silent: true }.
  const defaultStdio = opts.silent ? "pipe" : ["ignore", "inherit", "inherit"];
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: defaultStdio,
    shell: process.platform === "win32",
    encoding: "utf8",
    windowsHide: true,
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

/**
 * On Windows, resolve the real JS entry of pnpm (e.g. `.../pnpm/bin/pnpm.cjs`)
 * so we can invoke it with `node <entry> <args>` and bypass the `cmd.exe ->
 * pnpm.cmd -> cmd.exe -> tsc.cmd` chain. That chain is what triggers the
 * libuv `process_title` assertion (exit 3221226505 / STATUS_STACK_BUFFER_OVERRUN)
 * on Windows+MINGW64 builds.
 *
 * Cached. Returns the resolved path on success, false on failure (so we can
 * fall back to the normal `sh("pnpm", ...)` path).
 */
let _pnpmJsEntry;
function resolvePnpmEntry() {
  if (_pnpmJsEntry !== undefined) return _pnpmJsEntry;
  if (process.platform !== "win32") return (_pnpmJsEntry = false);
  try {
    const where = spawnSync("where", ["pnpm"], { encoding: "utf8" });
    if (where.status !== 0 || !where.stdout) return (_pnpmJsEntry = false);
    const candidates = where.stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /\.cmd$/i.test(l) && existsSync(l));
    for (const cmdPath of candidates) {
      const content = readFileSync(cmdPath, "utf8");
      // Matches any quoted path ending in pnpm.{js,cjs,mjs}, covers:
      //   - npm global shim:   "%dp0%\node_modules\pnpm\bin\pnpm.cjs"
      //   - corepack shim:     "%~dp0\node_modules\corepack\dist\pnpm.js"
      //   - volta / scoop etc
      const match = content.match(/"([^"\n]+[\\/](?:pnpm|corepack[\\/]dist[\\/]pnpm)\.(?:c?m?js))"/i);
      if (!match) continue;
      let script = match[1];
      // Expand cmd-style %~dp0 / %dp0% variables to the shim's own directory.
      // Handles both forms: `%~dp0\foo` and `%dp0%\foo` (with trailing %).
      script = script.replace(/%~?dp0%?\\?/gi, dirname(cmdPath) + sep);
      script = resolve(script);
      if (existsSync(script)) return (_pnpmJsEntry = script);
    }
    return (_pnpmJsEntry = false);
  } catch {
    return (_pnpmJsEntry = false);
  }
}

/**
 * Run `pnpm <args>` but, on Windows, skip the cmd shim entirely by invoking
 * `node <pnpm.cjs> <args>` directly. Falls back to regular `sh("pnpm", ...)`
 * if we can't resolve the entry.
 */
function shPnpm(args, opts = {}) {
  const entry = resolvePnpmEntry();
  if (entry) {
    return sh(process.execPath, [entry, ...args], { ...opts, shell: false });
  }
  return sh("pnpm", args, opts);
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

Walk through the recent code changes below and **update the documentation so it accurately reflects the current CLI behaviour**. CLI, READMEs, and the public documentation site must tell the same story. The version bump (package.json) and git operations are handled separately by the release script — DO NOT edit package.json and DO NOT run git commit/tag/push.

## What to keep in sync

1. \`CHANGELOG.md\` — add a \`## v${newVersion}\` section (above existing versions) that summarises the real changes from the git log. If a \`## Unreleased\` section already exists, convert it into the \`v${newVersion}\` section. Keep the \`## Unreleased\` heading at the top with an empty body for future work. Group bullets by \`### Features\` / \`### Bug Fixes\` / \`### Documentation\` / \`### Internal\`. One-line bullets, ending with the short commit SHA in parens.
2. \`README.md\` — if any new command, flag, or behaviour is visible in the git diff, update the relevant section. Keep the \`## Why this exists\` and \`## What \`memex\` gives you\` sections aligned with the code reality. Do NOT rewrite content that still matches reality.
3. \`README.zh-CN.md\` — keep structure and content in lockstep with README.md. Both must stay bilingual-parallel. Tone: concise, technical, second-person.
4. **Documentation website source** under \`docs/website/client/src/\` — this is the GitHub Pages site. The release script will rebuild it afterwards, so you edit the **source**, not the built output. Specifically:
   - \`docs/website/client/src/i18n/en-US.ts\` and \`docs/website/client/src/i18n/zh-CN.ts\` — bilingual copy for hero / features / commands / comparison / quickstart. Must stay strictly parallel.
   - \`docs/website/client/src/components/CommandsSection.tsx\` — the command reference list. **If the CLI gained/removed/renamed a command, you MUST edit this file** (icon import, \`buildCoreCommands\` / \`buildAdvancedCommands\` / \`buildUtilityCommands\` entry with the \`usage\` example, plus the matching i18n key). Only i18n edits is NOT enough; the component hardcodes command name + icon + usage example.
   - \`docs/website/client/src/components/{Features,Comparison,Architecture,QuickStart,Hero,Navbar,Footer}Section.tsx\` — edit if the relevant surface changed. Most of the copy comes from i18n, but section structure / anchor ids / nav links live in the component.
   - \`docs/website/client/src/pages/Home.tsx\` and \`docs/website/client/src/App.tsx\` — edit only if section ordering or routing changed.

## What you MUST NOT touch

- \`package.json\` anywhere (version bump happens later in the script; lockfiles stay put)
- \`docs/website/package.json\`, \`docs/website/pnpm-lock.yaml\`
- \`docs/website/client/src/components/ui/**\` — these are shadcn-generated atoms, off-limits
- Built output: \`docs/index.html\`, \`docs/assets/**\`, \`docs/.nojekyll\`, \`docs/website/dist/**\` — the release script rebuilds these from source afterwards
- Any file under \`src/\` — this is a doc sync, not a code edit
- Any file under \`dist/\` — will be rebuilt
- \`node_modules/\`, \`.llmwiki/\`, \`CHANGELOG\` rotation etc.
- Git commits, tags, pushes (the release script handles all git operations)

## Editing rules

- **Be conservative.** Only rewrite a sentence if the git diff shows the current text is stale. Do not reflow unchanged content.
- **Be exhaustive inside scope.** For any user-visible change you find, update **every** surface that mentions it: CHANGELOG + README (en/zh) + i18n (en/zh) + the matching Section component. Do not update half and leave the other half stale.
- **Keep bilingual parity.** Every time you edit en-US.ts you must mirror the change in zh-CN.ts (and same for README.md ↔ README.zh-CN.md). Same keys, same order, same semantic content.
- If a change in the git diff is purely internal refactoring (no user-visible surface change), mention it in CHANGELOG under \`### Internal\` and do NOT touch README / website source.
- If something is genuinely unclear (you can't tell whether it's user-visible or not), default to CHANGELOG \`### Internal\` only.

## Recent git log (since last release)

\`\`\`
${gitLog}
\`\`\`

## Recent changed files (--stat)

\`\`\`
${gitDiffStat}
\`\`\`

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

  // Why not pass promptText directly? Windows cmd.exe caps command lines at ~8192
  // chars and our prompt + git log + diff stat easily blows past that. Instead we
  // hand claude a tiny wrapper prompt that tells it to Read the file from disk and
  // then follow the instructions inside. Command line stays < 500 chars regardless
  // of git history size, works on every OS.
  const wrapperPrompt = [
    `You are the release-pipeline agent for ai-memex-cli.`,
    `Use the Read tool to open this instruction file and follow every rule inside exactly:`,
    ``,
    `    ${promptFile}`,
    ``,
    `Do NOT print the file contents. Just carry out the edits it describes and finish with a short summary of which files you changed.`,
  ].join("\n");

  const args = [
    "-p", wrapperPrompt,
    "--permission-mode", "acceptEdits",
    "--allowedTools", "Read,Write,Edit,Glob,Grep,Bash",
  ];
  info(`Invoking: claude -p <wrapper, full prompt in ${promptFile}> --permission-mode acceptEdits ...`);

  const code = await new Promise((resolveP) => {
    const child = spawn("claude", args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: true,
    });
    child.on("error", (err) => {
      fail(`Failed to spawn claude: ${err.message}`);
      resolveP(1);
    });
    child.on("close", (exitCode) => resolveP(exitCode ?? 0));
  });

  // Claude's TUI (ink) leaves ANSI state dirty. Scrub before anything else
  // spawns on Windows — otherwise the next child process can crash with a
  // libuv `process_title` assertion (seen as STATUS_STACK_BUFFER_OVERRUN).
  resetConsole();

  if (code !== 0) {
    warn(`Prompt kept for debugging: ${promptFile}`);
    die(`Claude Code exited with code ${code}. Aborting release — review the working tree manually.`);
  }

  // Success: best-effort cleanup
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* noop */ }
  return { ran: true };
}

// ── Preflight ────────────────────────────────────────────────────────────────
function preflight(args) {
  step("1/10", "Preflight");

  // pnpm availability
  if (!hasBin("pnpm")) die("pnpm is not in PATH");
  const pnpmEntry = resolvePnpmEntry();
  if (pnpmEntry) {
    ok(`pnpm is available (bypass: node "${pnpmEntry}")`);
  } else if (process.platform === "win32") {
    warn("pnpm is available, but cmd-shim bypass failed — will go via cmd.exe (may trip libuv process_title assertion on Windows)");
  } else {
    ok("pnpm is available");
  }

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
  step("2/10", "Documentation sync via Claude Code");
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

  // Record which files the agent touched, so step 6 can decide whether to rebuild docs.
  const touchedAfterAgent = shOut("git", ["status", "--porcelain"]).stdout;
  const websiteSourceTouched = touchedAfterAgent
    .split("\n")
    .some((l) => /docs\/website\/client\/src\//.test(l));

  // 3. Version bump
  step("3/10", `Bumping package.json → ${newVersion}`);
  if (args.dryRun) {
    info(`[dry-run] Would write package.json version = ${newVersion} (leaving file untouched)`);
  } else {
    pkg.version = newVersion;
    writePkg(pkgPath, pkg);
    ok(`package.json version is now ${newVersion}`);
  }

  // 4. Build CLI
  step("4/10", "Build CLI");
  shPnpm(["build"]);
  ok("CLI build succeeded");

  // 5. Rebuild GitHub Pages site (docs/) if website source changed
  step("5/10", "Rebuild docs/ (GitHub Pages)");
  const websiteDir = join(repoRoot, "docs", "website");
  const websitePkgExists = existsSync(join(websiteDir, "package.json"));
  let shouldRebuildDocs;
  if (!websitePkgExists) {
    shouldRebuildDocs = false;
    info("No docs/website/package.json — skipping.");
  } else if (args.rebuildDocs === "skip") {
    shouldRebuildDocs = false;
    info("Skipped (--no-rebuild-docs)");
  } else if (args.rebuildDocs === "force") {
    shouldRebuildDocs = true;
    info("Forced via --rebuild-docs");
  } else {
    shouldRebuildDocs = websiteSourceTouched;
    info(
      websiteSourceTouched
        ? "Website source changed by agent — will rebuild."
        : "No website source changes — skipping rebuild."
    );
  }
  if (shouldRebuildDocs) {
    if (args.dryRun) {
      info(`[dry-run] Would: (cd docs/website && pnpm install --frozen-lockfile && pnpm build:gh-pages)`);
    } else {
      shPnpm(["install", "--frozen-lockfile"], { cwd: websiteDir });
      shPnpm(["build:gh-pages"], { cwd: websiteDir });
      ok("docs/ rebuilt from docs/website/ source");
    }
  }

  // 6. Tests
  step("6/10", "Tests");
  if (args.skipTests) {
    info("Skipped (--skip-tests)");
  } else {
    shPnpm(["test:run"]);
    ok("Tests passed");
  }

  // 7. Final human review before writing git history
  step("7/10", "Final review before commit");
  const finalStatus = shOut("git", ["status", "--porcelain"]).stdout;
  if (finalStatus) {
    info("Final working-tree state (will go into the release commit):");
    for (const line of finalStatus.split("\n")) console.log(`      ${dim(line)}`);
    if (!args.yes && !args.dryRun) {
      const accept = await confirm("Proceed with commit + tag + publish?", true);
      if (!accept) die("Aborted by user — no git write, no publish. Working tree left as-is.", 130);
    }
  } else {
    info("Working tree is clean — commit will be empty (tag-only release).");
  }

  // 8. Git commit + tag
  step("8/10", "Git commit & tag");
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

  // 9. Publish
  step("9/10", "pnpm publish");
  if (args.dryRun) {
    info(`[dry-run] Would: pnpm publish --no-git-checks --access public`);
    shPnpm(["publish", "--no-git-checks", "--access", "public", "--dry-run"]);
  } else {
    shPnpm(["publish", "--no-git-checks", "--access", "public"]);
    ok(`Published ai-memex-cli@${newVersion} to npm`);
  }

  // 10. Push
  step("10/10", "Push to origin");
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
  if (args.dryRun) {
    console.log(yellow(bold(`✔ Dry-run complete — would release v${newVersion}`)));
    console.log(dim("  No files, tags, commits, or npm packages were actually written."));
  } else {
    console.log(green(bold(`✔ Released v${newVersion}`)));
    console.log(dim(`  https://www.npmjs.com/package/${pkg.name}`));
  }
}

main().catch((err) => {
  fail(err.stack || err.message || String(err));
  process.exit(1);
});
