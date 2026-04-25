#!/usr/bin/env node
// Phase 5: Run tests.
//
// Why we don't use `pnpm test:run`:
// On Windows + Node 22 + corepack-shimmed pnpm, the spawn chain
//   orchestrator → 05-test → corepack/pnpm.js → real pnpm → vitest → worker fork
// piles up enough nested child_process layers that libuv crashes inside the
// final fork with `Assertion failed: process_title` (STATUS_STACK_BUFFER_OVERRUN).
//
// We side-step this two ways:
//   1. Invoke vitest's JS entry directly with `node`, bypassing corepack+pnpm.
//   2. Use `--pool=threads` so vitest runs tests on worker_threads instead of
//      forking more child_process workers.
//
// Both are nondestructive — vitest config is left untouched, the threads pool
// gives identical behaviour for our pure-Node tests.
//
// Flags:
//   --skip   Don't actually run tests (record skipped=true in summary)

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { step, info, ok, warn, die, emitSummary } from "./_shared/log.mjs";
import { sh, shPnpm } from "./_shared/shell.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");

function parseArgs(argv) {
  const args = { skip: false };
  for (const a of argv) {
    if (a === "--skip") args.skip = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write("Usage: 05-test.mjs [--skip]\n");
      process.exit(0);
    } else die(`Unknown flag: ${a}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
process.chdir(repoRoot);

step("5/11", "Tests");

if (args.skip) {
  info("skipped (--skip)");
  emitSummary({ ok: true, skipped: true });
  process.exit(0);
}

const vitestEntry = join(repoRoot, "node_modules", "vitest", "vitest.mjs");
if (existsSync(vitestEntry)) {
  info(`node vitest.mjs run --pool=threads (direct invocation, no pnpm/corepack)`);
  sh(process.execPath, [vitestEntry, "run", "--pool=threads"], {
    cwd: repoRoot,
    shell: false,
  });
} else {
  warn("node_modules/vitest/vitest.mjs not found — falling back to pnpm test:run");
  warn("(may crash on Windows + Node 22 with libuv process_title assertion)");
  shPnpm(["test:run"], { cwd: repoRoot });
}

ok("tests passed");
emitSummary({ ok: true, skipped: false });
