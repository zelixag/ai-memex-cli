#!/usr/bin/env node
// Phase 2: Documentation sync via Claude Code agent.
//
// Hands the agent the git log + diff stat since last tag and tells it to update
// CHANGELOG.md, README.md, README.zh-CN.md, and website/client/src/{i18n,components}
// to match current code reality. The agent uses Read/Write/Edit tools — it does
// not run commits, version bumps, or builds.
//
// Flags:
//   --new-version <X.Y.Z>   Target version (required; agent uses it for CHANGELOG heading)
//   --manual                Skip agent, expect user to edit docs by hand
//   --no-pause              Don't wait for user review after agent finishes
//                           (orchestrator handles the pause itself)
//
// Exit codes:
//   0 = agent succeeded (or --manual skipped it)
//   2 = claude binary missing or exited non-zero (caller should retry --manual)

import { spawn } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  step,
  info,
  ok,
  warn,
  die,
  emitSummary,
} from "./_shared/log.mjs";
import { hasBin, resetConsole, shOut } from "./_shared/shell.mjs";
import { readPkg } from "./_shared/pkg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { newVersion: null, manual: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--new-version") args.newVersion = argv[++i];
    else if (a === "--manual") args.manual = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "Usage: 02-sync-docs.mjs --new-version <X.Y.Z> [--manual]\n",
      );
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  if (!args.newVersion) die("--new-version is required");
  return args;
}

const PROMPT = ({ oldVersion, newVersion, gitLog, gitDiffStat }) => `\
You are preparing the documentation for the \`ai-memex-cli\` release.

**Current version:** ${oldVersion}
**Target version:** ${newVersion}

## Your task

Update the documentation so it accurately reflects the current CLI behaviour.
CLI, READMEs, and the public documentation site must tell the same story. The
version bump (package.json), git operations, and build are handled by separate
release stages — DO NOT edit package.json, DO NOT run git commit/tag/push, and
DO NOT run pnpm build.

## What to keep in sync

1. \`CHANGELOG.md\` — add a \`## v${newVersion}\` section above existing versions
   that summarises the real changes from the git log. Group bullets by
   \`### 🚀 Enhancements\` / \`### 🩹 Fixes\` / \`### 📦 Release tooling & Docs\` /
   \`### 🧪 Tests\` / \`### 💅 Refactors\` (use only the headings that apply).
   One-line bullets, ending with the short commit SHA in parens.
2. \`README.md\` — if any new command, flag, or behaviour is visible in the diff,
   update the relevant section. Do NOT rewrite content that still matches reality.
3. \`README.zh-CN.md\` — keep structure and content in lockstep with README.md.
   Both must stay bilingual-parallel.
4. \`website/client/src/i18n/en-US.ts\` and \`website/client/src/i18n/zh-CN.ts\` —
   bilingual copy for hero / features / commands / comparison / quickstart.
   Must stay strictly parallel.
5. \`website/client/src/components/CommandsSection.tsx\` — the command reference
   list. **If the CLI gained/removed/renamed a command, you MUST edit this file**
   (icon import, buildCoreCommands / buildAdvancedCommands / buildUtilityCommands
   entry with the \`usage\` example, plus the matching i18n key). i18n alone is
   not enough.
6. \`website/client/src/components/{Features,Comparison,Architecture,QuickStart,Hero,Navbar,Footer,Scenarios}Section.tsx\`
   — edit only if the relevant surface changed. Most copy lives in i18n; section
   structure / anchor ids / nav links live in the component.

## What you MUST NOT touch

- \`package.json\` (version bump happens later)
- \`website/package.json\`, \`website/pnpm-lock.yaml\`
- \`website/client/src/components/ui/**\` (shadcn-generated atoms)
- Built output: \`docs/index.html\`, \`docs/assets/**\`, \`docs/.nojekyll\`,
  \`website/dist/**\` (release script rebuilds these)
- Anything under \`src/\` (this is doc sync, not code edit)
- Anything under \`dist/\`, \`node_modules/\`, \`.llmwiki/\`
- Git commits, tags, pushes

## Editing rules

- **Be conservative.** Only rewrite a sentence if the diff shows the current text
  is stale.
- **Be exhaustive inside scope.** For any user-visible change, update every
  surface that mentions it: CHANGELOG + README (en/zh) + i18n (en/zh) + the
  matching Section component. Do not update half and leave the other half stale.
- **Keep bilingual parity.** Every edit to en-US.ts must mirror in zh-CN.ts; same
  for README.md ↔ README.zh-CN.md.
- Internal-only refactors → CHANGELOG \`### 💅 Refactors\` only.

## Recent git log (since last release)

\`\`\`
${gitLog}
\`\`\`

## Recent changed files (--stat)

\`\`\`
${gitDiffStat}
\`\`\`

Output a short summary (which files you changed) and use Edit/Write tools to
apply edits.
`;

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

step("2/11", `Documentation sync (target v${args.newVersion})`);

if (args.manual) {
  warn("Manual mode — agent skipped. Edit CHANGELOG.md / README*.md / website/client/src/ by hand.");
  emitSummary({ ok: true, mode: "manual", filesChanged: [] });
  process.exit(0);
}

if (!hasBin("claude")) {
  warn("`claude` binary not found in PATH.");
  warn("Re-run with --manual to edit docs by hand, then continue.");
  emitSummary({ ok: false, reason: "claude-missing" });
  process.exit(2);
}

// Snapshot git status BEFORE agent runs so we can diff later.
const beforeStatus = shOut("git", ["status", "--porcelain"]).stdout;

// Build prompt inputs.
const lastTag = shOut("git", ["describe", "--tags", "--abbrev=0"]).stdout || null;
const logRange = lastTag ? `${lastTag}..HEAD` : "HEAD";
const gitLog =
  shOut("git", ["log", logRange, "--oneline", "--no-decorate", "-n", "100"]).stdout ||
  "(no commits since last tag)";
const diffArgs = lastTag ? ["diff", "--stat", lastTag, "HEAD"] : ["diff", "--stat", "HEAD"];
const gitDiffStat = shOut("git", diffArgs).stdout || "(no diff)";

// Read current version from package.json.
const oldVersion = readPkg(repoRoot).data.version;

const promptText = PROMPT({
  oldVersion,
  newVersion: args.newVersion,
  gitLog,
  gitDiffStat,
});

const tmp = mkdtempSync(join(tmpdir(), "memex-release-"));
const promptFile = join(tmp, "prompt.md");
writeFileSync(promptFile, promptText, "utf8");
info(`prompt: ${promptFile}`);

// Tiny wrapper prompt. Why? Windows cmd.exe caps command lines at ~8192 chars
// and our full prompt easily blows past that with git log + diff. The wrapper
// stays under 500 chars and tells claude to Read the file off disk.
const wrapper = [
  "You are the release-pipeline agent for ai-memex-cli.",
  "Use the Read tool to open this instruction file and follow every rule inside exactly:",
  "",
  `    ${promptFile}`,
  "",
  "Do NOT print the file contents. Carry out the edits and finish with a short summary.",
].join("\n");

info("invoking: claude -p <wrapper> --permission-mode acceptEdits ...");
const code = await new Promise((resolveP) => {
  resetConsole();
  const child = spawn(
    "claude",
    [
      "-p",
      wrapper,
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Read,Write,Edit,Glob,Grep,Bash",
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: true,
    },
  );
  child.on("error", (err) => {
    warn(`spawn claude failed: ${err.message}`);
    resolveP(1);
  });
  child.on("close", (c) => resolveP(c ?? 0));
});

resetConsole();

if (code !== 0) {
  warn(`prompt kept for debugging: ${promptFile}`);
  emitSummary({ ok: false, mode: "agent", reason: "non-zero-exit", code });
  process.exit(2);
}

try {
  rmSync(tmp, { recursive: true, force: true });
} catch {
  /* noop */
}

// What did the agent actually change?
const afterStatus = shOut("git", ["status", "--porcelain"]).stdout;
const beforeSet = new Set(beforeStatus.split("\n").filter(Boolean));
const filesChanged = afterStatus
  .split("\n")
  .filter(Boolean)
  .filter((l) => !beforeSet.has(l))
  .map((l) => l.slice(3).trim());

if (filesChanged.length === 0) {
  info("agent made no changes (docs already match code)");
} else {
  ok(`agent touched ${filesChanged.length} file(s):`);
  for (const f of filesChanged) info(`    ${f}`);
}

emitSummary({ ok: true, mode: "agent", filesChanged });
