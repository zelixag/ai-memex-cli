// Shell helpers — sh / shOut / shPnpm with Windows pnpm-shim bypass.
// Inherited from the previous scripts/release.mjs; the bypass is critical for
// avoiding libuv `process_title` assertion (STATUS_STACK_BUFFER_OVERRUN) when
// the cmd.exe shim chain spawns tsc on Windows.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fail } from "./log.mjs";

/**
 * Reset terminal state on Windows before spawning children. Claude Code's TUI
 * (ink) leaves ANSI attrs / cursor mode / window title in a weird state that
 * has been known to crash the next child process. Writing SGR-reset +
 * empty-OSC-title before each spawn wipes the slate.
 */
export function resetConsole() {
  if (process.platform === "win32" && process.stderr.isTTY) {
    process.stderr.write("\x1b[0m\x1b]0;\x07");
  }
}

/**
 * Synchronous exec with sane defaults:
 *  - inherit stdout/stderr for visibility
 *  - ignore stdin (children should never read from a half-polluted TTY)
 *  - die on non-zero exit unless { allowFail: true }
 *
 * Note: shell defaults to false. Windows + shell:true mangles args with spaces
 * (`git commit -m "release: v0.3.0"` was getting split). The few callers that
 * need .cmd shim resolution (pnpm fallback) opt in explicitly.
 */
export function sh(cmd, args, opts = {}) {
  resetConsole();
  const defaultStdio = opts.silent ? "pipe" : ["ignore", "inherit", "inherit"];
  const r = spawnSync(cmd, args, {
    stdio: defaultStdio,
    shell: false,
    encoding: "utf8",
    windowsHide: true,
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) {
    fail(`${cmd} ${args.join(" ")} exited with code ${r.status}`);
    if (opts.silent) {
      if (r.stdout) process.stderr.write(r.stdout);
      if (r.stderr) process.stderr.write(r.stderr);
    }
    process.exit(r.status ?? 1);
  }
  return r;
}

/** Run a command and capture stdout/stderr without aborting on failure. */
export function shOut(cmd, args, opts = {}) {
  const r = sh(cmd, args, { ...opts, silent: true, allowFail: true });
  return {
    stdout: (r.stdout ?? "").trim(),
    stderr: (r.stderr ?? "").trim(),
    code: r.status,
  };
}

/** Check whether a binary is on PATH. */
export function hasBin(name) {
  const probe = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(probe, [name], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return r.status === 0;
}

/**
 * On Windows, resolve the real JS entry of pnpm (e.g. `.../pnpm/bin/pnpm.cjs`)
 * so we can invoke it with `node <entry> <args>` and bypass the cmd.exe shim
 * chain. That chain triggers a libuv `process_title` assertion when spawning
 * native binaries like tsc.
 *
 * Returns a path on success, false on any failure (caller falls back to plain
 * `pnpm`). Cached after first call.
 */
let _pnpmJsEntry;
export function resolvePnpmEntry() {
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
      // Match any quoted path ending in pnpm.{js,cjs,mjs}, covering:
      //   - npm global shim:   "%dp0%\node_modules\pnpm\bin\pnpm.cjs"
      //   - corepack shim:     "%~dp0\node_modules\corepack\dist\pnpm.js"
      //   - volta / scoop etc.
      const match = content.match(
        /"([^"\n]+[\\/](?:pnpm|corepack[\\/]dist[\\/]pnpm)\.(?:c?m?js))"/i,
      );
      if (!match) continue;
      let script = match[1];
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
 * Run `pnpm <args>` but, on Windows, skip the cmd shim by invoking
 * `node <pnpm.cjs> <args>` directly. Falls back to `sh("pnpm", ...)` when
 * the entry can't be resolved (where it must opt into shell:true on Windows
 * because `pnpm` is a .cmd shim that the bare exec loader can't find).
 */
export function shPnpm(args, opts = {}) {
  const entry = resolvePnpmEntry();
  if (entry) {
    return sh(process.execPath, [entry, ...args], { ...opts, shell: false });
  }
  return sh("pnpm", args, {
    ...opts,
    shell: opts.shell ?? process.platform === "win32",
  });
}

/** Async spawn with stdio: inherit. Resolves to exit code. */
export function spawnInherit(cmd, args, opts = {}) {
  resetConsole();
  return new Promise((resolveP) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: true,
      ...opts,
    });
    child.on("error", (err) => {
      fail(`Failed to spawn ${cmd}: ${err.message}`);
      resolveP(1);
    });
    child.on("close", (code) => resolveP(code ?? 0));
  });
}
